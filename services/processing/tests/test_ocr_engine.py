import numpy as np
import cv2
import pytest
from app.services.ocr_engine import assess_image_quality, OCREngine, OCRLineResult, get_ocr_engine


def test_assess_image_quality_sharp():
    # Create sharp synthetic image with high contrast edges
    img = np.zeros((800, 1000, 3), dtype=np.uint8)
    cv2.putText(img, "REPUBLIK INDONESIA", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 3.0, (255, 255, 255), 5)
    quality = assess_image_quality(img)
    assert quality.width == 1000
    assert quality.height == 800
    assert quality.is_low_res is False
    assert quality.is_blurred is False
    assert quality.blur_score > 100.0
    assert len(quality.findings) == 0


def test_assess_image_quality_blurred():
    # Create heavily blurred image
    img = np.zeros((800, 1000, 3), dtype=np.uint8)
    cv2.putText(img, "BLUR TEST", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 2.0, (255, 255, 255), 2)
    blurred = cv2.GaussianBlur(img, (51, 51), 0)
    quality = assess_image_quality(blurred)
    assert quality.is_blurred is True
    assert any(f.type == "BLURRED_IMAGE" for f in quality.findings)


def test_assess_image_quality_low_res():
    img = np.zeros((200, 300, 3), dtype=np.uint8)
    quality = assess_image_quality(img)
    assert quality.is_low_res is True
    assert any(f.type == "LOW_RESOLUTION" for f in quality.findings)


def test_ocr_engine_mock_extraction():
    engine = OCREngine(reader=None)  # None initializes mock/fallback reader for test mode
    lines = engine.extract_text(np.zeros((100, 100, 3), dtype=np.uint8), mock_output=[
        ("NIK : 3204051205900001", 0.95, [[10, 10], [200, 10], [200, 30], [10, 30]]),
        ("Nama : BUDI SANTOSO", 0.92, [[10, 35], [200, 35], [200, 55], [10, 55]]),
    ])
    assert len(lines) == 2
    assert lines[0].text == "NIK : 3204051205900001"
    assert lines[0].confidence == 0.95


def test_assess_image_quality_grayscale_and_combined_findings():
    # Test 2D grayscale image that is both blurred and low resolution
    img = np.zeros((200, 400), dtype=np.uint8)
    quality = assess_image_quality(img)
    assert quality.width == 400
    assert quality.height == 200
    assert quality.is_low_res is True
    assert quality.is_blurred is True
    finding_types = {f.type for f in quality.findings}
    assert "BLURRED_IMAGE" in finding_types
    assert "LOW_RESOLUTION" in finding_types


def test_ocr_engine_with_reader_mock():
    # Test OCREngine with injected mock reader instance
    class DummyReader:
        def readtext(self, image):
            return [
                ([[10.0, 10.0], [200.0, 10.0], [200.0, 30.0], [10.0, 30.0]], "  PROVINSI DKI JAKARTA  ", 0.98765)
            ]

    engine = OCREngine(reader=DummyReader())
    lines = engine.extract_text(np.zeros((100, 100, 3), dtype=np.uint8))
    assert len(lines) == 1
    assert lines[0].text == "PROVINSI DKI JAKARTA"
    assert lines[0].confidence == 0.9877
    assert lines[0].bbox == [[10, 10], [200, 10], [200, 30], [10, 30]]


def test_get_ocr_engine_singleton():
    engine1 = get_ocr_engine()
    engine2 = get_ocr_engine()
    assert engine1 is engine2


def test_ocr_engine_reader_gpu_flag(monkeypatch):
    import sys
    calls = []

    class MockEasyOCRModule:
        class Reader:
            def __init__(self, languages, gpu=False, quantize=True):
                calls.append({"languages": languages, "gpu": gpu, "quantize": quantize})

    monkeypatch.setitem(sys.modules, "easyocr", MockEasyOCRModule)

    from app.config import AppConfig

    # With CPU
    monkeypatch.setattr("app.services.ocr_engine.get_settings", lambda: AppConfig(whisper_device="cpu"))
    engine_cpu = OCREngine()
    engine_cpu._get_reader()
    assert len(calls) == 1
    assert calls[0]["gpu"] is False
    assert calls[0]["languages"] == ["id", "en"]

    # With CUDA
    monkeypatch.setattr("app.services.ocr_engine.get_settings", lambda: AppConfig(whisper_device="cuda"))
    engine_cuda = OCREngine()
    engine_cuda._get_reader()
    assert len(calls) == 2
    assert calls[1]["gpu"] is True


def test_supports_cpu_quantized_ocr_engines(monkeypatch):
    import sys
    from types import SimpleNamespace
    from app.services.ocr_engine import _supports_cpu_quantized_ocr

    fake_torch = SimpleNamespace(backends=SimpleNamespace(quantized=SimpleNamespace(engine="x86")))
    monkeypatch.setitem(sys.modules, "torch", fake_torch)
    monkeypatch.setattr("app.services.ocr_engine.platform.system", lambda: "Linux")
    monkeypatch.setattr("app.services.ocr_engine.platform.machine", lambda: "x86_64")
    assert _supports_cpu_quantized_ocr() is True

    fake_torch.backends.quantized.engine = "fbgemm"
    assert _supports_cpu_quantized_ocr() is True

    # Non-AVX2 x86_64 Linux (e.g., Xeon X5675 / Westmere) falls back to onednn -> disable quantize
    fake_torch.backends.quantized.engine = "onednn"
    assert _supports_cpu_quantized_ocr() is False

    fake_torch.backends.quantized.engine = "qnnpack"
    assert _supports_cpu_quantized_ocr() is False

    monkeypatch.setattr("app.services.ocr_engine.platform.machine", lambda: "aarch64")
    assert _supports_cpu_quantized_ocr() is True

    # Non-Linux platforms (e.g., Windows) retain default quantized behavior
    monkeypatch.setattr("app.services.ocr_engine.platform.system", lambda: "Windows")
    monkeypatch.setattr("app.services.ocr_engine.platform.machine", lambda: "AMD64")
    fake_torch.backends.quantized.engine = "onednn"
    assert _supports_cpu_quantized_ocr() is True


def test_ocr_engine_reader_quantize_auto_and_override(monkeypatch):
    import sys
    calls = []

    class MockEasyOCRModule:
        class Reader:
            def __init__(self, languages, gpu=False, quantize=True):
                calls.append({"languages": languages, "gpu": gpu, "quantize": quantize})

    monkeypatch.setitem(sys.modules, "easyocr", MockEasyOCRModule)

    from app.config import AppConfig

    monkeypatch.setattr("app.services.ocr_engine._supports_cpu_quantized_ocr", lambda: False)
    monkeypatch.setattr("app.services.ocr_engine.get_settings", lambda: AppConfig(whisper_device="cpu", ocr_quantize=None))
    OCREngine()._get_reader()
    assert calls[-1]["quantize"] is False

    monkeypatch.setattr("app.services.ocr_engine._supports_cpu_quantized_ocr", lambda: True)
    OCREngine()._get_reader()
    assert calls[-1]["quantize"] is True

    monkeypatch.setattr("app.services.ocr_engine._supports_cpu_quantized_ocr", lambda: False)
    monkeypatch.setattr("app.services.ocr_engine.get_settings", lambda: AppConfig(whisper_device="cpu", ocr_quantize=True))
    OCREngine()._get_reader()
    assert calls[-1]["quantize"] is True

    monkeypatch.setattr("app.services.ocr_engine._supports_cpu_quantized_ocr", lambda: True)
    monkeypatch.setattr("app.services.ocr_engine.get_settings", lambda: AppConfig(whisper_device="cpu", ocr_quantize=False))
    OCREngine()._get_reader()
    assert calls[-1]["quantize"] is False
