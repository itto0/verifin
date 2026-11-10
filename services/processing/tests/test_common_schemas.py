from datetime import datetime, timezone
import pytest
from pydantic import BaseModel, ValidationError
from app.schemas.common import ProcessEnvelope, Finding, EvidenceRef
from app.config import AppConfig, get_settings


class DummyData(BaseModel):
    key: str
    value: int


def test_process_envelope_valid_payload():
    payload = DummyData(key="test", value=42)
    finding = Finding(
        type="TEST_ANOMALY",
        severity="medium",
        description="A test finding",
        field_ref="key",
    )
    ref = EvidenceRef(
        ref_id="ref_001",
        label="Cropped Image",
        uri="evidence/ref_001.jpg",
        content_type="image/jpeg",
    )

    envelope = ProcessEnvelope[DummyData](
        status="success",
        confidence=98.5,
        model_version="test-v1.0",
        data=payload,
        findings=[finding],
        evidence_refs=[ref],
    )

    dumped = envelope.model_dump()
    assert dumped["status"] == "success"
    assert dumped["confidence"] == 98.5
    assert dumped["model_version"] == "test-v1.0"
    assert dumped["data"]["key"] == "test"
    assert len(dumped["findings"]) == 1
    assert dumped["findings"][0]["severity"] == "medium"
    assert len(dumped["evidence_refs"]) == 1
    assert dumped["processed_at"] is not None


def test_process_envelope_confidence_validation():
    # Confidence > 100 should raise ValidationError
    with pytest.raises(ValidationError):
        ProcessEnvelope[DummyData](
            status="success",
            confidence=105.0,  # Invalid: max 100
            model_version="test-v1.0",
            data=DummyData(key="x", value=1),
        )

    # Confidence < 0 should raise ValidationError
    with pytest.raises(ValidationError):
        ProcessEnvelope[DummyData](
            status="success",
            confidence=-1.0,  # Invalid: min 0
            model_version="test-v1.0",
            data=DummyData(key="x", value=1),
        )


def test_process_envelope_status_validation():
    # Status must be "success", "partial", or "failed"
    with pytest.raises(ValidationError):
        ProcessEnvelope[DummyData](
            status="invalid_status",
            confidence=80.0,
            model_version="test-v1.0",
            data=DummyData(key="x", value=1),
        )


def test_finding_severity_validation():
    # Finding severity must be "low", "medium", "high", or "critical"
    with pytest.raises(ValidationError):
        Finding(
            type="ERR",
            severity="extreme",  # Invalid
            description="Boom",
        )


def test_app_config_defaults():
    config = get_settings()
    assert isinstance(config, AppConfig)
    assert config.app_name == "VeriFin Processing Service"
    assert config.version == "0.1.0"
    assert config.blur_threshold == 100.0
    assert config.min_image_width == 600
    assert config.whisper_model_size == "small"

    # Verify cached instance
    config2 = get_settings()
    assert config is config2
