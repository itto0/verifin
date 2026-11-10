from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class ICRField(BaseModel):
    label: str
    value: str
    confidence: float
    bbox: List[List[int]] = Field(default_factory=list)
    needs_review: bool = False


class ICRFormResult(BaseModel):
    form_type: str = "SURVEY_FORM_CMO"
    fields: Dict[str, ICRField] = Field(default_factory=dict)
    raw_text: str = ""
