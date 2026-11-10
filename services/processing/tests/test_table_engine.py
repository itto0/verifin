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
