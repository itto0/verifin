import io
import os
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.routers.voice import router
from app.schemas.voice import AudioSegment
from app.services.audio_engine import get_audio_engine, AudioEngine
from app.services.voice_qa import audit_script_compliance, calculate_voice_qa

app = FastAPI()
app.include_router(router, prefix="/api/v1/voice")


def sample_compliant_segments():
    return [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=4.0, text="Iya selamat pagi mba", speaker="customer"),
        AudioSegment(id=2, start=4.2, end=7.0, text="Panggilan ini direkam untuk keperluan verifikasi pengajuan pembiayaan", speaker="agent"),
        AudioSegment(id=3, start=7.2, end=9.0, text="Baik silakan mba", speaker="customer"),
        AudioSegment(id=4, start=9.2, end=12.0, text="Bisa konfirmasi nama lengkap dan tanggal lahir bapak?", speaker="agent"),
        AudioSegment(id=5, start=12.2, end=14.0, text="Nama saya Budi Santoso lahir 12 Mei 1990", speaker="customer"),
        AudioSegment(id=6, start=14.2, end=16.0, text="Terima kasih bapak telah meluangkan waktu, selamat beraktivitas", speaker="agent"),
    ]


def test_audit_script_compliance():
    segments = sample_compliant_segments()
    checklist = audit_script_compliance(segments)
    assert len(checklist) == 4
    assert all(item.passed for item in checklist)
    assert checklist[0].matched_utterance == "Selamat pagi dengan saya dari BAF Finance"


def test_audit_script_compliance_missing_recording_disclosure():
    # Agent does not mention recording disclosure or verification
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=4.0, text="Iya halo mba", speaker="customer"),
        AudioSegment(id=2, start=4.2, end=6.0, text="Bisa sebutkan nama lengkap dan unit motor?", speaker="agent"),
        AudioSegment(id=3, start=6.5, end=8.0, text="Nama saya Budi Santoso", speaker="customer"),
        AudioSegment(id=4, start=8.2, end=10.0, text="Terima kasih bapak, selamat beraktivitas", speaker="agent"),
    ]
    checklist = audit_script_compliance(segments)
    assert len(checklist) == 4
    # Stage 2 (PURPOSE & RECORDING DISCLOSURE) should fail
    stage2 = next(c for c in checklist if "RECORDING" in c.stage)
    assert not stage2.passed
    assert stage2.matched_utterance is None


def test_audit_script_compliance_stage1_missing_company_identity():
    # Agent greets but forgets company name (BAF / Bussan Auto Finance)
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya selaku customer service", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=5.0, text="Panggilan ini direkam untuk keperluan verifikasi pengajuan pembiayaan", speaker="agent"),
        AudioSegment(id=2, start=5.5, end=7.0, text="Konfirmasi nama bapak", speaker="agent"),
        AudioSegment(id=3, start=7.5, end=9.0, text="Terima kasih bapak selamat beraktivitas", speaker="agent"),
    ]
    checklist = audit_script_compliance(segments)
    stage1 = checklist[0]
    assert not stage1.passed
    assert stage1.matched_utterance is None


def test_audit_script_compliance_stage1_missing_greeting():
    # Agent states company name but misses greeting
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Dari BAF Finance mau tanya-tanya", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=5.0, text="Panggilan ini direkam untuk keperluan verifikasi pengajuan pembiayaan", speaker="agent"),
        AudioSegment(id=2, start=5.5, end=7.0, text="Konfirmasi nama bapak", speaker="agent"),
        AudioSegment(id=3, start=7.5, end=9.0, text="Terima kasih bapak selamat beraktivitas", speaker="agent"),
    ]
    checklist = audit_script_compliance(segments)
    stage1 = checklist[0]
    assert not stage1.passed
    assert stage1.matched_utterance is None


def test_audit_script_compliance_stage2_missing_recording_word():
    # Agent states purpose ("verifikasi pengajuan pembiayaan") but omits "direkam" / "rekaman"
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=2.5, end=5.0, text="Tujuan panggilan ini untuk verifikasi pengajuan pembiayaan", speaker="agent"),
        AudioSegment(id=2, start=5.5, end=7.0, text="Konfirmasi nama bapak", speaker="agent"),
        AudioSegment(id=3, start=7.5, end=9.0, text="Terima kasih bapak selamat beraktivitas", speaker="agent"),
    ]
    checklist = audit_script_compliance(segments)
    stage2 = checklist[1]
    assert not stage2.passed
    assert stage2.matched_utterance is None


def test_audit_script_compliance_customer_speech_ignored():
    # Customer says compliant phrases, agent says nothing compliant
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Halo apa kabar", speaker="agent"),
        AudioSegment(id=1, start=2.2, end=5.0, text="BAF Finance selamat pagi panggilan direkam untuk verifikasi", speaker="customer"),
    ]
    checklist = audit_script_compliance(segments)
    # Since agent did not say any of those, all stages should be unfulfilled
    assert all(not item.passed for item in checklist)


def test_calculate_voice_qa():
    segments = sample_compliant_segments()
    qa_result, findings = calculate_voice_qa(segments)
    assert qa_result.qa_score >= 85.0
    assert qa_result.hesitation_count == 0
    assert len(findings) == 0
    assert qa_result.transcription.duration == 16.0


def test_calculate_voice_qa_missing_stage_high_severity():
    # Omitting stage 2 (RECORDING DISCLOSURE)
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=2.2, end=3.5, text="Iya halo mba", speaker="customer"),
        AudioSegment(id=2, start=3.8, end=5.5, text="Konfirmasi nama dan motor bapak?", speaker="agent"),
        AudioSegment(id=3, start=5.8, end=7.0, text="Budi Santoso", speaker="customer"),
        AudioSegment(id=4, start=7.2, end=9.0, text="Terima kasih bapak, selamat beraktivitas", speaker="agent"),
    ]
    qa_result, findings = calculate_voice_qa(segments)
    assert qa_result.qa_score < 100.0
    recording_findings = [f for f in findings if f.type == "SCRIPT_STAGE_MISSED" and f.severity == "high"]
    assert len(recording_findings) == 1
    assert "RECORDING" in recording_findings[0].description


def test_calculate_voice_qa_missing_greeting_medium_severity():
    # Omitting stage 1 (GREETING & IDENTITY)
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Panggilan ini direkam untuk verifikasi pembiayaan", speaker="agent"),
        AudioSegment(id=1, start=2.2, end=3.5, text="Iya halo", speaker="customer"),
        AudioSegment(id=2, start=3.8, end=5.5, text="Konfirmasi nama dan unit motor bapak?", speaker="agent"),
        AudioSegment(id=3, start=5.8, end=7.0, text="Budi Santoso", speaker="customer"),
        AudioSegment(id=4, start=7.2, end=9.0, text="Terima kasih bapak", speaker="agent"),
    ]
    qa_result, findings = calculate_voice_qa(segments)
    greeting_findings = [f for f in findings if f.type == "SCRIPT_STAGE_MISSED" and f.severity == "medium"]
    assert len(greeting_findings) == 1
    assert "GREETING" in greeting_findings[0].description


def test_calculate_voice_qa_hesitation_deductions():
    # Segments with hesitation keyword and acoustic pause (>1.5s)
    segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=4.0, end=6.0, text="Ee.. anu.. iya selamat pagi", speaker="customer"),  # 2.0s gap + keywords
        AudioSegment(id=2, start=6.2, end=9.0, text="Panggilan ini direkam untuk verifikasi pembiayaan", speaker="agent"),
        AudioSegment(id=3, start=9.2, end=11.0, text="Baik mba", speaker="customer"),
        AudioSegment(id=4, start=11.2, end=13.0, text="Konfirmasi nama lengkap dan motor bapak?", speaker="agent"),
        AudioSegment(id=5, start=13.2, end=15.0, text="Budi Santoso", speaker="customer"),
        AudioSegment(id=6, start=15.2, end=17.0, text="Terima kasih banyak, selamat beraktivitas", speaker="agent"),
    ]
    qa_result, findings = calculate_voice_qa(segments)
    assert qa_result.hesitation_count > 0
    assert qa_result.qa_score < 100.0
    hesitation_finding_types = {f.type for f in findings}
    assert "HESITATION_LONG_PAUSE" in hesitation_finding_types or "HESITATION_KEYWORD" in hesitation_finding_types


def test_calculate_voice_qa_empty_segments():
    qa_result, findings = calculate_voice_qa([])
    assert qa_result.qa_score == 0.0
    assert qa_result.transcription.duration == 0.0
    assert len(qa_result.script_adherence) == 4
    assert all(not item.passed for item in qa_result.script_adherence)
    assert len(findings) == 4


@pytest.fixture
def client(monkeypatch):
    test_engine = AudioEngine(model="mock")
    orig_transcribe = test_engine.transcribe_file

    def mock_transcribe(audio_path, mock_segments=None):
        return orig_transcribe(audio_path, mock_segments=sample_compliant_segments())

    monkeypatch.setattr(test_engine, "transcribe_file", mock_transcribe)
    app.dependency_overrides[get_audio_engine] = lambda: test_engine
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_post_voice_transcribe(client):
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert len(body["data"]["segments"]) == 7
    assert body["confidence"] == 100.0


def test_post_voice_transcribe_confidence_calculation_empty_segments(monkeypatch):
    test_engine = AudioEngine(model="mock")
    orig_transcribe = test_engine.transcribe_file
    monkeypatch.setattr(
        test_engine,
        "transcribe_file",
        lambda p, mock_segments=None: orig_transcribe(p, mock_segments=[]),
    )
    app.dependency_overrides[get_audio_engine] = lambda: test_engine
    custom_client = TestClient(app)
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = custom_client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    assert response.json()["confidence"] == 90.0
    app.dependency_overrides.clear()


def test_post_voice_transcribe_confidence_calculation_varied(monkeypatch):
    test_engine = AudioEngine(model="mock")
    orig_transcribe = test_engine.transcribe_file
    custom_segments = [
        AudioSegment(id=0, start=0.0, end=1.0, text="Halo", confidence=0.8),
        AudioSegment(id=1, start=1.5, end=3.0, text="Selamat pagi", confidence=0.9),
    ]
    monkeypatch.setattr(
        test_engine,
        "transcribe_file",
        lambda p, mock_segments=None: orig_transcribe(p, mock_segments=custom_segments),
    )
    app.dependency_overrides[get_audio_engine] = lambda: test_engine
    custom_client = TestClient(app)
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = custom_client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    assert response.json()["confidence"] == 85.0
    app.dependency_overrides.clear()


def test_post_voice_audio_file_too_large(client):
    class LargeFakeFile(io.RawIOBase):
        def __init__(self, size):
            self.size = size
            self.read_bytes = 0

        def read(self, n=-1):
            if self.read_bytes >= self.size:
                return b""
            chunk_size = n if n > 0 else (self.size - self.read_bytes)
            chunk_size = min(chunk_size, self.size - self.read_bytes)
            self.read_bytes += chunk_size
            return b"a" * chunk_size

    large_file = LargeFakeFile(51 * 1024 * 1024)
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("huge.wav", large_file, "audio/wav")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Audio file too large (max 50MB)"


def test_post_voice_transcribe_empty_file(client):
    empty_audio = io.BytesIO(b"")
    response = client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("empty.wav", empty_audio, "audio/wav")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Empty audio file"


def test_post_voice_analyze(client):
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = client.post(
        "/api/v1/voice/analyze",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert body["data"]["qa_score"] >= 85.0
    assert len(body["data"]["script_adherence"]) == 4


def test_post_voice_analyze_empty_file(client):
    empty_audio = io.BytesIO(b"")
    response = client.post(
        "/api/v1/voice/analyze",
        files={"file": ("empty.wav", empty_audio, "audio/wav")},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Empty audio file"


def test_post_voice_analyze_partial_status(monkeypatch):
    test_engine = AudioEngine(model="mock")
    orig_transcribe = test_engine.transcribe_file
    # Missing stage 2 to trigger findings and status="partial"
    partial_segments = [
        AudioSegment(id=0, start=0.0, end=2.0, text="Selamat pagi dengan saya dari BAF Finance", speaker="agent"),
        AudioSegment(id=1, start=2.2, end=3.5, text="Iya halo", speaker="customer"),
        AudioSegment(id=2, start=3.8, end=5.5, text="Konfirmasi nama dan motor bapak?", speaker="agent"),
        AudioSegment(id=3, start=5.8, end=7.0, text="Budi Santoso", speaker="customer"),
        AudioSegment(id=4, start=7.2, end=9.0, text="Terima kasih bapak, selamat beraktivitas", speaker="agent"),
    ]
    monkeypatch.setattr(test_engine, "transcribe_file", lambda p, mock_segments=None: orig_transcribe(p, mock_segments=partial_segments))
    app.dependency_overrides[get_audio_engine] = lambda: test_engine

    custom_client = TestClient(app)
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = custom_client.post(
        "/api/v1/voice/analyze",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "partial"
    assert len(body["findings"]) > 0
    app.dependency_overrides.clear()


def test_post_voice_analyze_status_failed(monkeypatch):
    test_engine = AudioEngine(model="mock")
    orig_transcribe = test_engine.transcribe_file
    # Non-compliant call with multiple hesitations -> score < 50 -> failed
    failed_segments = [
        AudioSegment(id=0, start=0.0, end=1.0, text="Halo", speaker="agent"),
        AudioSegment(id=1, start=3.0, end=5.0, text="Ee.. anu.. siapa ini", speaker="customer"),
        AudioSegment(id=2, start=7.0, end=8.0, text="Nganu apaan ya radak lupa", speaker="customer"),
    ]
    monkeypatch.setattr(test_engine, "transcribe_file", lambda p, mock_segments=None: orig_transcribe(p, mock_segments=failed_segments))
    app.dependency_overrides[get_audio_engine] = lambda: test_engine

    custom_client = TestClient(app)
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = custom_client.post(
        "/api/v1/voice/analyze",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "failed"
    assert body["data"]["qa_score"] < 50.0
    app.dependency_overrides.clear()


def test_temp_audio_file_cleanup(monkeypatch):
    captured_paths = []
    test_engine = AudioEngine(model="mock")
    orig_transcribe = test_engine.transcribe_file

    def spy_transcribe(audio_path, mock_segments=None):
        captured_paths.append(audio_path)
        assert os.path.exists(audio_path)
        return orig_transcribe(audio_path, mock_segments=sample_compliant_segments())

    monkeypatch.setattr(test_engine, "transcribe_file", spy_transcribe)
    app.dependency_overrides[get_audio_engine] = lambda: test_engine

    custom_client = TestClient(app)
    fake_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....")
    response = custom_client.post(
        "/api/v1/voice/transcribe",
        files={"file": ("call.wav", fake_audio, "audio/wav")},
    )
    assert response.status_code == 200
    assert len(captured_paths) == 1
    # Check that temp file was cleaned up after request
    assert not os.path.exists(captured_paths[0])
    app.dependency_overrides.clear()

