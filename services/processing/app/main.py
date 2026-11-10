from contextlib import asynccontextmanager
from typing import Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import icr, ocr, voice


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions (if any)
    yield
    # Shutdown actions (if any)


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Unified Python Processing Service for e-KTP OCR, ICR, and Voice Analytics",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr.router, prefix="/api/v1/ocr")
app.include_router(icr.router, prefix="/api/v1/icr")
app.include_router(voice.router, prefix="/api/v1/voice")


@app.get("/")
async def root() -> Dict[str, str]:
    return {
        "message": "Welcome to VeriFin Python Processing Service",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    cfg = get_settings()
    return {
        "status": "healthy",
        "version": cfg.version,
        "device": cfg.whisper_device,
        "models": {
            "ocr": cfg.ocr_model_version,
            "voice": cfg.voice_model_version,
        },
    }
