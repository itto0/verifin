from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.common import Finding


class KTPFieldExtraction(BaseModel):
    nik: Optional[str] = None
    nama: Optional[str] = None
    tempat_lahir: Optional[str] = None
    tgl_lahir: Optional[str] = None
    jenis_kelamin: Optional[str] = None
    alamat: Optional[str] = None
    rt_rw: Optional[str] = None
    kel_desa: Optional[str] = None
    kecamatan: Optional[str] = None
    agama: Optional[str] = None
    status_perkawinan: Optional[str] = None
    pekerjaan: Optional[str] = None
    kewarganegaraan: Optional[str] = None
    berlaku_hingga: Optional[str] = None
    field_confidences: Dict[str, float] = Field(default_factory=dict)


class KTPValidationResult(BaseModel):
    is_valid: bool
    province_code: Optional[str] = None
    regency_code: Optional[str] = None
    district_code: Optional[str] = None
    gender: Optional[str] = None
    birth_date_str: Optional[str] = None
    sequence: Optional[str] = None
    tamper_score: float = 0.0
    findings: List[Finding] = Field(default_factory=list)


class KTPProcessResult(BaseModel):
    fields: KTPFieldExtraction
    validation: KTPValidationResult
    quality_score: float
    is_blurred: bool
