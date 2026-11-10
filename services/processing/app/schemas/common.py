from datetime import datetime, timezone
from typing import Generic, List, Literal, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class Finding(BaseModel):
    type: str = Field(..., description="Machine-readable code, e.g. BLURRED_IMAGE, NIK_MISMATCH")
    severity: Literal["low", "medium", "high", "critical"]
    description: str
    field_ref: Optional[str] = None
    timestamp: Optional[float] = None


class EvidenceRef(BaseModel):
    ref_id: str
    label: str
    uri: str
    content_type: str


class ProcessEnvelope(BaseModel, Generic[T]):
    status: Literal["success", "partial", "failed"]
    confidence: float = Field(..., ge=0.0, le=100.0, description="Overall confidence 0-100")
    model_version: str
    processed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    data: Optional[T] = None
    findings: List[Finding] = Field(default_factory=list)
    evidence_refs: List[EvidenceRef] = Field(default_factory=list)
