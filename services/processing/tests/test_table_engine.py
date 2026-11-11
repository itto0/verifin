import numpy as np
import pytest
from app.schemas.table import TableCell, ExtractedTable, TableExtractionResult
from app.services.table_engine import TableEngine, get_table_engine


def test_table_schemas_serialization():
    cell = TableCell(row_idx=0, col_idx=0, text="Tanggal", confidence=0.98, bbox=[10, 20, 100, 50], is_header=True)
    table = ExtractedTable(
        table_idx=0,
        headers=["Tanggal", "Keterangan", "Jumlah"],
        rows=[
            ["01/11/2026", "Gaji Pokok", "10.000.000"],
            ["05/11/2026", "Tunjangan", "2.500.000"],
        ],
        cells=[cell],
        num_rows=2,
        num_cols=3,
        bbox=[10, 20, 500, 300],
    )
    result = TableExtractionResult(tables_found=1, tables=[table], raw_text="Tanggal Keterangan Jumlah")
    assert result.tables_found == 1
    assert len(result.tables[0].rows) == 2
    assert result.tables[0].headers[1] == "Keterangan"
    assert result.tables[0].cells[0].is_header is True


def test_table_engine_mock_extraction():
    engine = TableEngine()
    dummy_img = np.zeros((400, 600, 3), dtype=np.uint8)

    mock_table_data = [
        ExtractedTable(
            table_idx=0,
            headers=["Deskripsi", "Nilai"],
            rows=[["Gaji Pokok", "7.500.000"], ["PPH21", "250.000"]],
            num_rows=2,
            num_cols=2,
            bbox=[20, 30, 400, 200],
        )
    ]

    result, findings = engine.extract_tables_from_image(dummy_img, mock_tables=mock_table_data)
    assert result.tables_found == 1
    assert len(result.tables) == 1
    assert result.tables[0].headers == ["Deskripsi", "Nilai"]
    assert result.tables[0].rows[0] == ["Gaji Pokok", "7.500.000"]
    assert len(findings) == 0


def test_table_engine_empty_tables_finding():
    engine = TableEngine()
    dummy_img = np.zeros((400, 600, 3), dtype=np.uint8)

    result, findings = engine.extract_tables_from_image(dummy_img, mock_tables=[])
    assert result.tables_found == 0
    assert len(result.tables) == 0
    assert any(f.type == "NO_TABLES_DETECTED" for f in findings)


def test_get_table_engine_singleton():
    engine1 = get_table_engine()
    engine2 = get_table_engine()
    assert engine1 is engine2


def test_table_cell_confidence_validation():
    # Valid confidence
    cell = TableCell(row_idx=0, col_idx=0, text="A", confidence=0.5)
    assert cell.confidence == 0.5

    # Out of range confidence should fail pydantic validation
    with pytest.raises(Exception):
        TableCell(row_idx=0, col_idx=0, text="A", confidence=1.5)

    with pytest.raises(Exception):
        TableCell(row_idx=0, col_idx=0, text="A", confidence=-0.1)


def test_table_engine_content_mapping(monkeypatch):
    from collections import OrderedDict
    from dataclasses import dataclass

    @dataclass
    class FakeBBox:
        x1: int
        y1: int
        x2: int
        y2: int

    @dataclass
    class FakeCell:
        bbox: FakeBBox
        value: str
        confidence: int = 90

    fake_bbox = FakeBBox(10, 20, 200, 100)
    fake_cell = FakeCell(bbox=fake_bbox, value="CellText", confidence=90)

    class FakeDFValues:
        @staticmethod
        def tolist():
            return [["CellText"]]

    class FakeDF:
        columns = ["Col1"]
        values = FakeDFValues()

    class FakeTable:
        bbox = fake_bbox
        content = OrderedDict([(0, [fake_cell])])
        df = FakeDF()

    class FakeDoc:
        def __init__(self, *args, **kwargs):
            pass

        def extract_tables(self, *args, **kwargs):
            return [FakeTable()]

    monkeypatch.setattr("img2table.document.Image", FakeDoc)
    monkeypatch.setattr("img2table.ocr.EasyOCR", lambda *args, **kwargs: None)

    engine = TableEngine()
    monkeypatch.setattr(engine, "_get_reader", lambda: None)

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    result, findings = engine.extract_tables_from_image(img)
    assert result.tables_found == 1
    assert len(result.tables[0].cells) == 1
    cell = result.tables[0].cells[0]
    assert cell.text == "CellText"
    assert cell.row_idx == 0
    assert cell.col_idx == 0
    assert cell.confidence == 0.9
    assert cell.bbox == [10, 20, 200, 100]


def test_table_engine_rangeindex_header_promotion(monkeypatch):
    from collections import OrderedDict
    from dataclasses import dataclass

    @dataclass
    class FakeBBox:
        x1: int
        y1: int
        x2: int
        y2: int

    @dataclass
    class FakeCell:
        bbox: FakeBBox
        value: str
        confidence: int = 95
        row: int = 0
        col: int = 0

    fake_bbox = FakeBBox(10, 20, 200, 100)
    c00 = FakeCell(bbox=fake_bbox, value="Item", confidence=95, row=0, col=0)
    c01 = FakeCell(bbox=fake_bbox, value="Price", confidence=90, row=0, col=1)
    c10 = FakeCell(bbox=fake_bbox, value="Apple", confidence=88, row=1, col=0)
    c11 = FakeCell(bbox=fake_bbox, value="1000", confidence=92, row=1, col=1)

    class FakeDFValues:
        @staticmethod
        def tolist():
            return [["Item", "Price"], ["Apple", "1000"]]

    class FakeDF:
        # Default integer RangeIndex produced by img2table / pandas
        columns = [0, 1]
        values = FakeDFValues()

    class FakeTable:
        bbox = fake_bbox
        content = OrderedDict([
            (0, [c00, c01]),
            (1, [c10, c11]),
        ])
        df = FakeDF()

    class FakeDoc:
        def __init__(self, *args, **kwargs):
            pass

        def extract_tables(self, *args, **kwargs):
            return [FakeTable()]

    monkeypatch.setattr("img2table.document.Image", FakeDoc)
    monkeypatch.setattr("img2table.ocr.EasyOCR", lambda *args, **kwargs: None)

    engine = TableEngine()
    monkeypatch.setattr(engine, "_get_reader", lambda: None)

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    result, findings = engine.extract_tables_from_image(img)

    assert result.tables_found == 1
    tbl = result.tables[0]
    # Row 0 promoted to headers
    assert tbl.headers == ["Item", "Price"]
    # Row 1 is the remaining data row
    assert tbl.rows == [["Apple", "1000"]]
    assert tbl.num_rows == 1
    assert tbl.num_cols == 2

    # Check cell header flags
    assert len(tbl.cells) == 4
    header_cells = [c for c in tbl.cells if c.is_header]
    data_cells = [c for c in tbl.cells if not c.is_header]
    assert len(header_cells) == 2
    assert all(c.row_idx == 0 for c in header_cells)
    assert len(data_cells) == 2
    assert all(c.row_idx == 1 for c in data_cells)


def test_table_engine_ocr_wrapper_kw_init(monkeypatch):
    from unittest.mock import MagicMock

    class MockEasyOCRClass:
        def __init__(self, *args, **kwargs):
            raise TypeError("EasyOCR __init__ signature mismatch")

    monkeypatch.setattr("img2table.ocr.EasyOCR", MockEasyOCRClass)

    class FakeDoc:
        def __init__(self, *args, **kwargs):
            pass

        def extract_tables(self, *args, **kwargs):
            ocr = kwargs.get("ocr")
            # Verify ocr_wrapper compatibility attributes
            assert hasattr(ocr, "kw")
            assert ocr.kw == {}
            assert hasattr(ocr, "reader")
            assert ocr.lang == ["id", "en"]
            return []

    monkeypatch.setattr("img2table.document.Image", FakeDoc)

    engine = TableEngine()
    monkeypatch.setattr(engine, "_get_reader", lambda: MagicMock())

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    result, findings = engine.extract_tables_from_image(img)
    assert result.tables_found == 0


def test_table_engine_detect_rotation_enabled(monkeypatch):
    captured_kwargs = {}

    class FakeDoc:
        def __init__(self, *args, **kwargs):
            captured_kwargs.update(kwargs)

        def extract_tables(self, *args, **kwargs):
            return []

    monkeypatch.setattr("img2table.document.Image", FakeDoc)
    monkeypatch.setattr("img2table.ocr.EasyOCR", lambda *args, **kwargs: None)

    engine = TableEngine()
    monkeypatch.setattr(engine, "_get_reader", lambda: None)

    img = np.zeros((100, 100, 3), dtype=np.uint8)
    engine.extract_tables_from_image(img)

    assert captured_kwargs.get("detect_rotation") is True


def test_table_cell_colspan_rowspan_defaults_and_validation():
    default_cell = TableCell(row_idx=0, col_idx=0, text="A")
    assert default_cell.colspan == 1
    assert default_cell.rowspan == 1

    merged_cell = TableCell(row_idx=0, col_idx=0, text="Penghasilan", is_header=True, colspan=2, rowspan=1)
    assert merged_cell.colspan == 2
    assert merged_cell.rowspan == 1

    with pytest.raises(Exception):
        TableCell(row_idx=0, col_idx=0, text="Bad", colspan=0)


def test_table_engine_bordered_merged_header_with_outer_frame(monkeypatch):
    import cv2

    # Build synthetic document with decorative outer frame + 3x4 table with 2x merged header
    img = np.ones((800, 1200, 3), dtype=np.uint8) * 255
    # Outer decorative page border (should NOT swallow inner table!)
    cv2.rectangle(img, (30, 30), (1170, 770), (0, 0, 0), 3)

    # Inner table: x in [120, 1080], y in [200, 440]
    # Vertical lines: 120, 360, 600, 840, 1080
    # Horizontal lines: 200, 280, 360, 440
    # Row 0 merges (120..600) and (600..1080)
    cv2.rectangle(img, (120, 200), (1080, 440), (0, 0, 0), 2)
    cv2.line(img, (120, 280), (1080, 280), (0, 0, 0), 2)
    cv2.line(img, (120, 360), (1080, 360), (0, 0, 0), 2)
    cv2.line(img, (600, 200), (600, 440), (0, 0, 0), 2)
    # Inner column dividers start below row 0 header (y=280..440)
    cv2.line(img, (360, 280), (360, 440), (0, 0, 0), 2)
    cv2.line(img, (840, 280), (840, 440), (0, 0, 0), 2)

    # Synthetic EasyOCR detections matching the cells (and draw text onto img so TableExtractor measures char metrics)
    ocr_items = [
        ([[260, 225], [460, 225], [460, 255], [260, 255]], "Penghasilan", 0.92),
        ([[760, 225], [920, 225], [920, 255], [760, 255]], "Potongan", 0.90),
        ([[140, 305], [320, 305], [320, 335], [140, 335]], "Gaji Pokok", 0.94),
        ([[380, 305], [560, 305], [560, 335], [380, 335]], "Rp 7.500.000", 0.88),
        ([[620, 305], [780, 305], [780, 335], [620, 335]], "BPJS", 0.91),
        ([[860, 305], [1040, 305], [1040, 335], [860, 335]], "Rp 150.000", 0.86),
        ([[140, 385], [320, 385], [320, 415], [140, 415]], "Tunjangan", 0.93),
        ([[380, 385], [560, 385], [560, 415], [380, 415]], "Rp 850.000", 0.89),
        ([[620, 385], [780, 385], [780, 415], [620, 415]], "PPh 21", 0.87),
        ([[860, 385], [1040, 385], [1040, 415], [860, 415]], "Rp 75.000", 0.90),
    ]
    for box, text, _ in ocr_items:
        cv2.putText(img, text, (box[0][0], box[2][1]), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)

    class FakeReader:
        def readtext(self, image, *args, **kwargs):
            return ocr_items

    engine = TableEngine()
    monkeypatch.setattr(engine, "_get_reader", lambda: FakeReader())

    result, findings = engine.extract_tables_from_image(img, borderless=False)
    assert result.tables_found == 1
    tbl = result.tables[0]
    assert tbl.headers == ["Penghasilan", "", "Potongan", ""]
    assert tbl.rows == [
        ["Gaji Pokok", "Rp 7.500.000", "BPJS", "Rp 150.000"],
        ["Tunjangan", "Rp 850.000", "PPh 21", "Rp 75.000"],
    ]
    assert tbl.num_rows == 2
    assert tbl.num_cols == 4

    header_origin_cells = [c for c in tbl.cells if c.is_header and c.colspan > 1]
    assert len(header_origin_cells) == 2
    assert header_origin_cells[0].text == "Penghasilan"
    assert header_origin_cells[0].colspan == 2
    assert header_origin_cells[1].text == "Potongan"
    assert header_origin_cells[1].colspan == 2

    # Real OCR confidences should be preserved (< 1.0)
    non_empty_confs = [c.confidence for c in tbl.cells if c.text]
    assert all(0.80 <= conf <= 0.96 for conf in non_empty_confs)


def test_table_engine_borderless_keyvalue_and_columnar_and_toggle(monkeypatch):
    # Blank canvas (no grid lines at all) with two vertically separated blocks:
    # 1) Key-value metadata block (headers should remain [])
    # 2) Unbordered columnar financial table (row 0 should promote to headers)
    img = np.ones((900, 1200, 3), dtype=np.uint8) * 255
    ocr_items = [
        # Block 1: Key-Value form (y=80..180)
        ([[100, 90], [260, 90], [260, 120], [100, 120]], "Nama Karyawan", 0.92),
        ([[340, 90], [520, 90], [520, 120], [340, 120]], "AHMAD FAUZI", 0.95),
        ([[640, 90], [780, 90], [780, 120], [640, 120]], "Status", 0.91),
        ([[860, 90], [1040, 90], [1040, 120], [860, 120]], "Karyawan Tetap", 0.93),
        ([[100, 150], [240, 150], [240, 180], [100, 180]], "NIK", 0.96),
        ([[340, 150], [500, 150], [500, 180], [340, 180]], "SML-2018-0421", 0.90),
        ([[640, 150], [780, 150], [780, 180], [640, 180]], "Departemen", 0.92),
        ([[860, 150], [1060, 150], [1060, 180], [860, 180]], "Operasional", 0.91),
        # Block 2: Columnar data table (y=360..540)
        ([[100, 360], [240, 360], [240, 390], [100, 390]], "Tanggal", 0.95),
        ([[380, 360], [560, 360], [560, 390], [380, 390]], "Keterangan", 0.94),
        ([[760, 360], [920, 360], [920, 390], [760, 390]], "Nominal", 0.93),
        ([[100, 420], [260, 420], [260, 450], [100, 450]], "01/11/2026", 0.91),
        ([[380, 420], [580, 420], [580, 450], [380, 450]], "Gaji Pokok", 0.92),
        ([[760, 420], [940, 420], [940, 450], [760, 450]], "Rp 7.500.000", 0.89),
        ([[100, 480], [260, 480], [260, 510], [100, 510]], "05/11/2026", 0.90),
        ([[380, 480], [540, 480], [540, 510], [380, 510]], "Tunjangan", 0.94),
        ([[760, 480], [920, 480], [920, 510], [760, 510]], "Rp 850.000", 0.91),
    ]

    class FakeReader:
        def readtext(self, image, *args, **kwargs):
            return ocr_items

    engine = TableEngine()
    monkeypatch.setattr(engine, "_get_reader", lambda: FakeReader())

    # borderless=False must NOT detect borderless tables
    bordered_only, _ = engine.extract_tables_from_image(img, borderless=False)
    assert bordered_only.tables_found == 0

    # borderless=True must extract both blocks in reading order with accurate header promotion
    result, findings = engine.extract_tables_from_image(img, borderless=True)
    assert result.tables_found == 2
    assert len(findings) == 0

    kv_tbl, col_tbl = result.tables[0], result.tables[1]
    assert kv_tbl.headers == []
    assert kv_tbl.rows == [
        ["Nama Karyawan", "AHMAD FAUZI", "Status", "Karyawan Tetap"],
        ["NIK", "SML-2018-0421", "Departemen", "Operasional"],
    ]

    assert col_tbl.headers == ["Tanggal", "Keterangan", "Nominal"]
    assert col_tbl.rows == [
        ["01/11/2026", "Gaji Pokok", "Rp 7.500.000"],
        ["05/11/2026", "Tunjangan", "Rp 850.000"],
    ]


