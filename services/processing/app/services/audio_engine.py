import math
import re
from typing import Any, List, Optional
from app.config import get_settings
from app.schemas.common import Finding
from app.schemas.voice import AudioSegment, TranscriptionResult

# PyAV >= 14.0.0 removed the deprecated `metadata_errors` keyword argument from `av.open()`,
# but faster-whisper 1.x still passes `metadata_errors="ignore"` to `av.open()`.
# Safely patch `av.open` to strip `metadata_errors` when present.
try:
    import av

    _orig_av_open = av.open

    def _safe_av_open(*args, **kwargs):
        kwargs.pop("metadata_errors", None)
        return _orig_av_open(*args, **kwargs)

    av.open = _safe_av_open
except ImportError:
    pass


HESITATION_KEYWORDS = [
    r"\bee+\b",
    r"\banu+\b",
    r"\bnganu\b",
    r"\bapaan ya\b",
    r"\bradak lupa\b",
    r"\blupa saya\b",
]


def detect_hesitation_pauses(
    segments: List[AudioSegment],
    threshold_sec: float = 1.5,
) -> List[Finding]:
    """Detects acoustic silence gaps (>=1.5s) between turns and disfluency phrases."""
    findings: List[Finding] = []

    # 1. Silence gaps between consecutive segments
    for i in range(len(segments) - 1):
        gap = segments[i + 1].start - segments[i].end
        if gap >= threshold_sec:
            findings.append(
                Finding(
                    type="HESITATION_LONG_PAUSE",
                    severity="medium",
                    description=f"Long acoustic pause ({gap:.2f}s >= {threshold_sec}s) detected before response.",
                    timestamp=round(segments[i].end, 2),
                )
            )

    # 2. Verbal disfluencies in speech segments
    for seg in segments:
        text_lower = seg.text.lower()
        for kw in HESITATION_KEYWORDS:
            if re.search(kw, text_lower):
                findings.append(
                    Finding(
                        type="HESITATION_KEYWORD",
                        severity="low",
                        description=f"Hesitation / uncertainty marker detected: '{seg.text}'",
                        timestamp=round(seg.start, 2),
                    )
                )
                break

    return findings


class AudioEngine:
    def __init__(self, model: Optional[Any] = None):
        self._model = model

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            settings = get_settings()
            self._model = WhisperModel(
                settings.whisper_model_size,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type,
            )
        return self._model

    def transcribe_file(
        self,
        audio_path: str,
        mock_segments: Optional[List[AudioSegment]] = None,
    ) -> TranscriptionResult:
        if mock_segments is not None:
            duration = mock_segments[-1].end if mock_segments else 0.0
            full_txt = " ".join([s.text for s in mock_segments])
            return TranscriptionResult(
                language="id",
                duration=duration,
                full_transcript=full_txt,
                segments=mock_segments,
            )

        model = self._get_model()
        segments_generator, info = model.transcribe(
            audio_path,
            language="id",
            beam_size=5,
            vad_filter=True,
        )

        parsed_segments: List[AudioSegment] = []
        full_texts: List[str] = []

        for idx, s in enumerate(segments_generator):
            clean_text = s.text.strip()
            full_texts.append(clean_text)
            confidence = (
                round(float(math.exp(s.avg_logprob)), 2)
                if hasattr(s, "avg_logprob")
                else 0.9
            )
            parsed_segments.append(
                AudioSegment(
                    id=idx,
                    start=round(float(s.start), 2),
                    end=round(float(s.end), 2),
                    text=clean_text,
                    confidence=confidence,
                    speaker="agent" if idx % 2 == 0 else "customer",
                )
            )

        return TranscriptionResult(
            language=info.language if hasattr(info, "language") else "id",
            duration=round(float(info.duration), 2) if hasattr(info, "duration") else 0.0,
            full_transcript=" ".join(full_texts),
            segments=parsed_segments,
        )


_default_audio_engine: Optional[AudioEngine] = None


def get_audio_engine() -> AudioEngine:
    global _default_audio_engine
    if _default_audio_engine is None:
        _default_audio_engine = AudioEngine()
    return _default_audio_engine
