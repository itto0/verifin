from typing import List, Optional
from pydantic import BaseModel, Field


class TableCell(BaseModel):
    row_idx: int
    col_idx: int
    text: str
    confidence: float = 1.0  # 0.0 - 1.0
    bbox: Optional[List[int]] = None  # [x1, y1, x2, y2]
    is_header: bool = False


class ExtractedTable(BaseModel):
    table_idx: int
    headers: List[str] = Field(default_factory=list)
    rows: List[List[str]] = Field(default_factory=list)  # 2D array of string values
    cells: List[TableCell] = Field(default_factory=list)
    num_rows: int = 0
    num_cols: int = 0
    bbox: Optional[List[int]] = None  # [x1, y1, x2, y2]


class TableExtractionResult(BaseModel):
    tables_found: int = 0
    tables: List[ExtractedTable] = Field(default_factory=list)
    raw_text: str = ""
