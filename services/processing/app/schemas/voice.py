from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class AudioSegment(BaseModel):
    id: int
    start: float = Field(..., description="Start timestamp in seconds")
    end: float = Field(..., description="End timestamp in seconds")
    text: str
    speaker: Literal["agent", "customer", "unknown"] = "unknown"
    confidence: float = 1.0


class TranscriptionResult(BaseModel):
    language: str = "id"
    duration: float = 0.0
    full_transcript: str = ""
    segments: List[AudioSegment] = Field(default_factory=list)


class ScriptCheckItem(BaseModel):
    stage: str
    description: str
    passed: bool
    matched_utterance: Optional[str] = None


class VoiceQAResult(BaseModel):
    transcription: TranscriptionResult
    qa_score: float = Field(..., ge=0.0, le=100.0, description="Overall compliance QA score 0-100")
    script_adherence: List[ScriptCheckItem] = Field(default_factory=list)
    hesitation_count: int = 0
