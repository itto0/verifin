import os
import shutil
import tempfile
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from app.config import AppConfig, get_settings
from app.schemas.common import ProcessEnvelope
from app.schemas.voice import TranscriptionResult, VoiceQAResult
from app.services.audio_engine import get_audio_engine, AudioEngine
from app.services.voice_qa import calculate_voice_qa

router = APIRouter(tags=["Voice Analytics"])


MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024  # 50MB


def save_temp_audio(upload_file: UploadFile) -> str:
    if upload_file.size is not None and upload_file.size > MAX_AUDIO_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")

    suffix = os.path.splitext(upload_file.filename or "")[1] or ".wav"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            total_bytes = 0
            while chunk := upload_file.file.read(1024 * 1024):
                total_bytes += len(chunk)
                if total_bytes > MAX_AUDIO_SIZE_BYTES:
                    break
                tmp.write(chunk)

        if total_bytes > MAX_AUDIO_SIZE_BYTES:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
                tmp_path = None
            raise HTTPException(status_code=400, detail="Audio file too large (max 50MB)")

        if total_bytes == 0:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
                tmp_path = None
            raise HTTPException(status_code=400, detail="Empty audio file")
        return tmp_path
    except Exception:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


@router.post("/transcribe", response_model=ProcessEnvelope[TranscriptionResult])
def transcribe_audio(
    file: UploadFile = File(...),
    audio_engine: AudioEngine = Depends(get_audio_engine),
    settings: AppConfig = Depends(get_settings),
):
    tmp_path = save_temp_audio(file)
    try:
        result = audio_engine.transcribe_file(tmp_path)
        if result.segments:
            raw_conf = sum(s.confidence for s in result.segments) / len(result.segments) * 100.0
            confidence = round(float(max(0.0, min(100.0, raw_conf))), 1)
        else:
            confidence = 90.0

        return ProcessEnvelope[TranscriptionResult](
            status="success",
            confidence=confidence,
            model_version=settings.voice_model_version,
            data=result,
            findings=[],
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/analyze", response_model=ProcessEnvelope[VoiceQAResult])
def analyze_voice_call(
    file: UploadFile = File(...),
    audio_engine: AudioEngine = Depends(get_audio_engine),
    settings: AppConfig = Depends(get_settings),
):
    tmp_path = save_temp_audio(file)
    try:
        transcript = audio_engine.transcribe_file(tmp_path)
        qa_result, findings = calculate_voice_qa(transcript.segments)

        status = "failed" if qa_result.qa_score < 50.0 else (
            "partial" if qa_result.qa_score < 80.0 or findings else "success"
        )

        return ProcessEnvelope[VoiceQAResult](
            status=status,
            confidence=qa_result.qa_score,
            model_version=settings.voice_model_version,
            data=qa_result,
            findings=findings,
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
