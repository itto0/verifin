# VeriFin Python Processing Service

FastAPI service providing local OCR/ICR (e-KTP, surveyor forms) and Voice-to-Text analytics (Faster-Whisper, OJK compliance).

## Quick Start
```bash
uv sync --extra dev
uv run uvicorn app.main:app --reload --port 8000
```
