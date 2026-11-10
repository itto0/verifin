from functools import lru_cache
from typing import List, Optional, Tuple
import cv2
import numpy as np

from app.schemas.common import Finding
from app.schemas.table import ExtractedTable, TableCell, TableExtractionResult
from app.services.ocr_engine import get_ocr_engine


class TableEngine:
    def __init__(self):
        self._easyocr_reader = None

    def _get_reader(self):
        if self._easyocr_reader is None:
            ocr_engine = get_ocr_engine()
            self._easyocr_reader = ocr_engine._get_reader()
        return self._easyocr_reader

    def extract_tables_from_image(
        self,
        image_np: np.ndarray,
        borderless: bool = True,
        mock_tables: Optional[List[ExtractedTable]] = None,
    ) -> Tuple[TableExtractionResult, List[Finding]]:
        """Extracts tables from an image array using img2table or mock data."""
        findings: List[Finding] = []

        if mock_tables is not None:
            tables = mock_tables
            if len(tables) == 0:
                findings.append(
                    Finding(
                        type="NO_TABLES_DETECTED",
                        severity="low",
                        description="No structured tables were detected in the document.",
                        field_ref="tables",
                    )
                )
            return (
                TableExtractionResult(
                    tables_found=len(tables),
                    tables=tables,
                    raw_text="\n".join(["\t".join(row) for t in tables for row in t.rows]),
                ),
                findings,
            )

        # Production path using img2table
        try:
            from img2table.document import Image as Img2TableImage
            from img2table.ocr import EasyOCR as Img2TableEasyOCR

            # Encode image to memory buffer for img2table
            success, encoded_img = cv2.imencode(".png", image_np)
            if not success:
                raise ValueError("Failed to encode image array for table extraction")

            reader = self._get_reader()
            try:
                ocr_wrapper = Img2TableEasyOCR(reader=reader)
            except TypeError:
                ocr_wrapper = Img2TableEasyOCR.__new__(Img2TableEasyOCR)
                ocr_wrapper.lang = ["id", "en"]
                ocr_wrapper.reader = reader
            doc = Img2TableImage(encoded_img.tobytes())

            extracted = doc.extract_tables(
                ocr=ocr_wrapper,
                implicit_rows=borderless,
                borderless_tables=borderless,
                min_confidence=30,
            )

            tables: List[ExtractedTable] = []
            raw_lines: List[str] = []

            for idx, tbl in enumerate(extracted):
                df = tbl.df
                headers: List[str] = [str(col).strip() for col in df.columns]
                rows: List[List[str]] = [
                    [str(val).strip() if val is not None else "" for val in row]
                    for row in df.values.tolist()
                ]

                cells: List[TableCell] = []
                for cell in getattr(tbl, "cells", []):
                    cells.append(
                        TableCell(
                            row_idx=cell.row,
                            col_idx=cell.col,
                            text=str(cell.text or "").strip(),
                            confidence=float(getattr(cell, "confidence", 100) or 100) / 100.0,
                            bbox=[cell.bbox.x1, cell.bbox.y1, cell.bbox.x2, cell.bbox.y2]
                            if hasattr(cell, "bbox") and cell.bbox
                            else None,
                        )
                    )

                outer_bbox = (
                    [tbl.bbox.x1, tbl.bbox.y1, tbl.bbox.x2, tbl.bbox.y2]
                    if hasattr(tbl, "bbox") and tbl.bbox
                    else None
                )

                tables.append(
                    ExtractedTable(
                        table_idx=idx,
                        headers=headers,
                        rows=rows,
                        cells=cells,
                        num_rows=len(rows),
                        num_cols=len(headers) if headers else (len(rows[0]) if rows else 0),
                        bbox=outer_bbox,
                    )
                )

                raw_lines.append("\t".join(headers))
                for row in rows:
                    raw_lines.append("\t".join(row))

            if len(tables) == 0:
                findings.append(
                    Finding(
                        type="NO_TABLES_DETECTED",
                        severity="low",
                        description="No structured tables were detected in the document.",
                        field_ref="tables",
                    )
                )

            return (
                TableExtractionResult(
                    tables_found=len(tables),
                    tables=tables,
                    raw_text="\n".join(raw_lines),
                ),
                findings,
            )
        except Exception as e:
            findings.append(
                Finding(
                    type="TABLE_EXTRACTION_ERROR",
                    severity="medium",
                    description=f"Table extraction encountered an error: {str(e)}",
                    field_ref="tables",
                )
            )
            return TableExtractionResult(tables_found=0, tables=[]), findings


@lru_cache()
def get_table_engine() -> TableEngine:
    return TableEngine()
