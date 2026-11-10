import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert "version" in body
    assert "device" in body
    assert "models" in body
    assert body["models"]["ocr"] == "easyocr-id-en-v1"
    assert body["models"]["voice"] == "faster-whisper-small-id-v1"


def test_root_redirect_or_welcome(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    assert "docs" in body
    assert "health" in body


def test_cors_middleware_headers(client):
    response = client.get("/health", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_openapi_schema_contains_all_mounted_routers(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    paths = schema.get("paths", {})

    # Check root and health
    assert "/" in paths
    assert "/health" in paths

    # Check OCR routes
    assert "/api/v1/ocr/ktp" in paths
    assert "/api/v1/ocr/document" in paths

    # Check ICR routes
    assert "/api/v1/icr/survey-form" in paths

    # Check Voice routes
    assert "/api/v1/voice/transcribe" in paths
    assert "/api/v1/voice/analyze" in paths


def test_mounted_routers_endpoint_validation(client):
    # Verify routers are mounted and reject requests missing required multipart files
    assert client.post("/api/v1/ocr/ktp").status_code == 422
    assert client.post("/api/v1/ocr/document").status_code == 422
    assert client.post("/api/v1/icr/survey-form").status_code == 422
    assert client.post("/api/v1/voice/transcribe").status_code == 422
    assert client.post("/api/v1/voice/analyze").status_code == 422

