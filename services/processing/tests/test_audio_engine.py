import math
from unittest.mock import MagicMock
import pytest
from pydantic import ValidationError

from app.schemas.voice import (
    AudioSegment,
    ScriptCheckItem,
    TranscriptionResult,
    VoiceQAResult,
)
from app.services.audio_engine import (
    AudioEngine,
    detect_hesitation_pauses,
    get_audio_engine,
)


def test_detect_hesitation_pauses_found():
    # Segment 1 ends at 2.0s, Segment 2 starts at 4.0s -> pause = 2.0s (> 1.5s threshold)
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi bapak", speaker="agent"),
        AudioSegment(id=1, start=4.0, end=6.5, text="Iya pagi mba", speaker="customer"),
    ]
    findings = detect_hesitation_pauses(segments, threshold_sec=1.5)
    assert len(findings) == 1
    assert findings[0].type == "HESITATION_LONG_PAUSE"
    assert findings[0].severity == "medium"
    assert findings[0].timestamp == 2.0
    assert "2.00s >= 1.5s" in findings[0].description


def test_detect_hesitation_disfluency_keywords():
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Ee.. anu.. saya kurang yakin pak", speaker="customer"),
    ]
    findings = detect_hesitation_pauses(segments, threshold_sec=1.5)
    assert any(f.type == "HESITATION_KEYWORD" for f in findings)
    keyword_finding = next(f for f in findings if f.type == "HESITATION_KEYWORD")
    assert keyword_finding.severity == "low"
    assert keyword_finding.timestamp == 0.0


def test_detect_hesitation_no_pauses_or_keywords():
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan Bank Mantap", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=4.0, text="Pagi saya ingin bertanya", speaker="customer"),
    ]
    # Gap is 0.5s, threshold is 1.5s
    findings = detect_hesitation_pauses(segments, threshold_sec=1.5)
    assert len(findings) == 0


def test_detect_hesitation_multiple_pauses_and_keywords():
    segments = [
        AudioSegment(id=0, start=0.0, end=1.0, text="Halo bapak", speaker="agent"),
        AudioSegment(id=1, start=3.0, end=4.0, text="Nganu apaan ya", speaker="customer"),
        AudioSegment(id=2, start=6.0, end=7.0, text="Baik bapak", speaker="agent"),
    ]
    findings = detect_hesitation_pauses(segments, threshold_sec=1.5)
    # Pause 1: 3.0 - 1.0 = 2.0s -> LONG_PAUSE
    # Segment 1 has "nganu" -> KEYWORD
    # Pause 2: 6.0 - 4.0 = 2.0s -> LONG_PAUSE
    types = [f.type for f in findings]
    assert types.count("HESITATION_LONG_PAUSE") == 2
    assert types.count("HESITATION_KEYWORD") == 1


def test_audio_engine_mock_transcribe():
    engine = AudioEngine(model=None)
    result = engine.transcribe_file(
        "dummy.wav",
        mock_segments=[
            AudioSegment(id=0, start=0.0, end=1.5, text="Halo selamat pagi", speaker="agent"),
            AudioSegment(id=1, start=1.8, end=3.5, text="Iya dengan siapa ini", speaker="customer"),
        ],
    )
    assert result.duration == 3.5
    assert len(result.segments) == 2
    assert "Halo selamat pagi" in result.full_transcript
    assert result.language == "id"


def test_audio_engine_empty_mock_segments():
    engine = AudioEngine(model=None)
    result = engine.transcribe_file("dummy.wav", mock_segments=[])
    assert result.duration == 0.0
    assert len(result.segments) == 0
    assert result.full_transcript == ""


def test_audio_engine_transcribe_with_model():
    mock_model = MagicMock()
    # Mock segment objects returned by faster-whisper generator
    seg1 = MagicMock()
    seg1.text = " Halo selamat pagi "
    seg1.start = 0.0
    seg1.end = 2.1
    seg1.avg_logprob = -0.1  # exp(-0.1) ~ 0.9048

    seg2 = MagicMock()
    seg2.text = " Pagi juga "
    seg2.start = 2.5
    seg2.end = 4.0
    seg2.avg_logprob = -0.2  # exp(-0.2) ~ 0.8187

    info = MagicMock()
    info.language = "id"
    info.duration = 4.0

    mock_model.transcribe.return_value = ([seg1, seg2], info)

    engine = AudioEngine(model=mock_model)
    result = engine.transcribe_file("test.wav")

    mock_model.transcribe.assert_called_once_with(
        "test.wav",
        language="id",
        beam_size=5,
        vad_filter=True,
    )
    assert result.language == "id"
    assert result.duration == 4.0
    assert result.full_transcript == "Halo selamat pagi Pagi juga"
    assert len(result.segments) == 2

    # Speaker alternation
    assert result.segments[0].speaker == "agent"
    assert result.segments[1].speaker == "customer"
    assert result.segments[0].confidence == pytest.approx(round(math.exp(-0.1), 2), rel=1e-2)


def test_get_audio_engine_singleton():
    engine1 = get_audio_engine()
    engine2 = get_audio_engine()
    assert engine1 is engine2
    assert isinstance(engine1, AudioEngine)


def test_voice_schemas_validation():
    # Valid VoiceQAResult
    transcription = TranscriptionResult(
        language="id",
        duration=10.0,
        full_transcript="Halo bapak",
        segments=[
            AudioSegment(id=0, start=0.0, end=2.0, text="Halo bapak", speaker="agent")
        ],
    )
    script_check = ScriptCheckItem(
        stage="greeting",
        description="Salam pembuka standar",
        passed=True,
        matched_utterance="Halo bapak",
    )
    qa_result = VoiceQAResult(
        transcription=transcription,
        qa_score=95.5,
        script_adherence=[script_check],
        hesitation_count=0,
    )
    assert qa_result.qa_score == 95.5
    assert len(qa_result.script_adherence) == 1
    assert qa_result.script_adherence[0].passed is True

    # Invalid qa_score (> 100)
    with pytest.raises(ValidationError):
        VoiceQAResult(
            transcription=transcription,
            qa_score=105.0,
        )

    # Invalid speaker literal
    with pytest.raises(ValidationError):
        AudioSegment(id=0, start=0.0, end=1.0, text="test", speaker="robot")


def test_pyav_metadata_errors_compat():
    """Verify av.open compatibility patch strips metadata_errors without TypeError."""
    import av
    # Calling av.open with metadata_errors should not raise TypeError
    try:
        # Pass a nonexistent or mock path; it may fail with FileNotFoundError or av.FFmpegError,
        # but MUST NOT fail with TypeError: open() got an unexpected keyword argument 'metadata_errors'
        av.open("nonexistent_test_audio.wav", mode="r", metadata_errors="ignore")
    except TypeError as exc:
        pytest.fail(f"av.open raised TypeError due to metadata_errors: {exc}")
    except Exception:
        # FileNotFoundError or av.FFmpegError is expected for nonexistent file
        pass

