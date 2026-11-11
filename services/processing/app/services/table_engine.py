from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

from app.schemas.common import Finding
from app.schemas.table import ExtractedTable, TableCell, TableExtractionResult
from app.services.ocr_engine import get_ocr_engine


@dataclass
class _OcrWord:
    x1: int
    y1: int
    x2: int
    y2: int
    text: str
    conf: float

    @property
    def width(self) -> int:
        return self.x2 - self.x1

    @property
    def height(self) -> int:
        return self.y2 - self.y1

    @property
    def area(self) -> int:
        return max(0, self.width) * max(0, self.height)

    @property
    def xc(self) -> float:
        return (self.x1 + self.x2) / 2.0

    @property
    def yc(self) -> float:
        return (self.y1 + self.y2) / 2.0


def _is_key_value_table(matrix: List[List[str]]) -> bool:
    """Distinguish key-value form grids (Label | Value) from columnar tables."""
    if not matrix or len(matrix) < 2:
        return False
    n_cols = len(matrix[0])
    if n_cols not in (2, 4):
        return False

    even_vals = [matrix[r][c] for r in range(len(matrix)) for c in range(0, n_cols, 2) if matrix[r][c]]
    odd_vals = [matrix[r][c] for r in range(len(matrix)) for c in range(1, n_cols, 2) if matrix[r][c]]
    if not even_vals or not odd_vals:
        return False

    even_has_digit = sum(1 for v in even_vals if any(ch.isdigit() for ch in v))
    row0_odd_has_value = any(
        any(ch.isdigit() for ch in matrix[0][c]) or matrix[0][c].isupper()
        for c in range(1, n_cols, 2)
        if matrix[0][c]
    )
    if row0_odd_has_value and even_has_digit == 0:
        return True
    return False


class TableEngine:
    def __init__(self):
        self._easyocr_reader = None

    def _get_reader(self):
        if self._easyocr_reader is None:
            ocr_engine = get_ocr_engine()
            self._easyocr_reader = ocr_engine._get_reader()
        return self._easyocr_reader

    def _build_ocr_wrapper(self, reader):
        from img2table.ocr import EasyOCR as Img2TableEasyOCR

        try:
            return Img2TableEasyOCR(reader=reader)
        except TypeError:
            ocr_wrapper = Img2TableEasyOCR.__new__(Img2TableEasyOCR)
            ocr_wrapper.lang = ["id", "en"]
            ocr_wrapper.reader = reader
            ocr_wrapper.kw = {}
            return ocr_wrapper

    def _extract_ocr_words(self, image_np: np.ndarray, reader) -> List[_OcrWord]:
        if reader is None or not hasattr(reader, "readtext"):
            return []

        ocr_raw = reader.readtext(image_np)
        words: List[_OcrWord] = []
        for bbox, text, conf in ocr_raw:
            t = str(text).strip()
            if not t:
                continue
            xs = [int(p[0]) for p in bbox]
            ys = [int(p[1]) for p in bbox]
            x1, y1, x2, y2 = min(xs), min(ys), max(xs), max(ys)
            if x2 > x1 and y2 > y1:
                words.append(_OcrWord(x1, y1, x2, y2, t, max(0.0, min(1.0, float(conf)))))
        return words

    def _filter_non_table_cells(
        self, raw_cells, ocr_words: List[_OcrWord], img_w: int, img_h: int
    ):
        """Remove tiny noise boxes, outer decorative page frames enclosing inner cells, and empty margin strips."""
        non_tiny = [c for c in raw_cells if c.width >= 20 and c.height >= 16]
        non_container = []
        for i, c in enumerate(non_tiny):
            inner_count = 0
            for j, o in enumerate(non_tiny):
                if i == j or o.area >= c.area:
                    continue
                ix1, iy1 = max(c.x1, o.x1), max(c.y1, o.y1)
                ix2, iy2 = min(c.x2, o.x2), min(c.y2, o.y2)
                if ix2 > ix1 and iy2 > iy1:
                    if (ix2 - ix1) * (iy2 - iy1) >= 0.85 * o.area:
                        inner_count += 1
                        if inner_count >= 2:
                            break
            if inner_count < 2:
                non_container.append(c)

        kept = []
        for c in non_container:
            has_text = False
            for w in ocr_words:
                ix1, iy1 = max(c.x1, w.x1), max(c.y1, w.y1)
                ix2, iy2 = min(c.x2, w.x2), min(c.y2, w.y2)
                if ix2 > ix1 and iy2 > iy1:
                    if (ix2 - ix1) * (iy2 - iy1) > 0.4 * max(1, w.area):
                        has_text = True
                        break
            if not has_text:
                if c.width > 0.50 * img_w:
                    continue
                if c.height > 0.30 * img_h and c.width < 120:
                    continue
            kept.append(c)
        return kept

    def _assign_words_to_bordered_table(
        self, tb, ocr_words: List[_OcrWord]
    ) -> Tuple[List[List[str]], List[List[float]], List[List[Optional[List[int]]]], Dict[Tuple[int, int], Tuple[int, int, bool]]]:
        unique_boxes = {}
        for r_idx, row in enumerate(tb.rows):
            for c_idx, c in enumerate(row.cells):
                key = (c.x1, c.y1, c.x2, c.y2)
                if key not in unique_boxes:
                    unique_boxes[key] = {"cell": c, "positions": [], "items": []}
                unique_boxes[key]["positions"].append((r_idx, c_idx))

        tb_words = [
            w for w in ocr_words
            if tb.x1 - 5 <= w.xc <= tb.x2 + 5 and tb.y1 - 5 <= w.yc <= tb.y2 + 5
        ]

        for w in tb_words:
            overlaps = []
            for key, info in unique_boxes.items():
                c = info["cell"]
                ix1, iy1 = max(c.x1, w.x1), max(c.y1, w.y1)
                ix2, iy2 = min(c.x2, w.x2), min(c.y2, w.y2)
                if ix2 > ix1 and iy2 > iy1:
                    ratio = ((ix2 - ix1) * (iy2 - iy1)) / max(1, w.area)
                    if ratio >= 0.15:
                        overlaps.append((ratio, key, c))
            overlaps.sort(key=lambda t: t[0], reverse=True)
            if not overlaps:
                continue

            # Split OCR tokens accidentally merged across vertical grid dividers ("left | right")
            if (
                "|" in w.text
                and len(overlaps) >= 2
                and overlaps[0][0] >= 0.15
                and overlaps[1][0] >= 0.15
                and overlaps[0][2].y1 == overlaps[1][2].y1
            ):
                parts = [p.strip() for p in w.text.split("|") if p.strip()]
                top_cells = sorted(overlaps[: len(parts)], key=lambda t: t[2].x1)
                if len(parts) == len(top_cells):
                    for part, (_, key, _) in zip(parts, top_cells):
                        unique_boxes[key]["items"].append(
                            _OcrWord(w.x1, w.y1, w.x2, w.y2, part, w.conf)
                        )
                    continue

            best_ratio, best_key, _ = overlaps[0]
            if best_ratio >= 0.30:
                unique_boxes[best_key]["items"].append(w)

        grid = [["" for _ in range(tb.nb_columns)] for _ in range(tb.nb_rows)]
        confs = [[1.0 for _ in range(tb.nb_columns)] for _ in range(tb.nb_rows)]
        bboxes: List[List[Optional[List[int]]]] = [
            [None for _ in range(tb.nb_columns)] for _ in range(tb.nb_rows)
        ]
        spans: Dict[Tuple[int, int], Tuple[int, int, bool]] = {}

        for info in unique_boxes.values():
            c_box = info["cell"]
            items = info["items"]
            if items:
                items_sorted = sorted(items, key=lambda w: (w.y1, w.x1))
                lines = [[items_sorted[0]]]
                for w in items_sorted[1:]:
                    prev = lines[-1][-1]
                    v_overlap = min(prev.y2, w.y2) - max(prev.y1, w.y1)
                    if v_overlap >= 0.4 * min(prev.height, w.height):
                        lines[-1].append(w)
                    else:
                        lines.append([w])
                text = "\n".join(
                    " ".join(w.text for w in sorted(line, key=lambda x: x.x1))
                    for line in lines
                )
                avg_conf = float(np.mean([w.conf for w in items]))
            else:
                text = ""
                avg_conf = 1.0

            positions = sorted(info["positions"])
            r0, c0 = positions[0]
            r_max = max(r for r, _ in positions)
            c_max = max(c for _, c in positions)
            colspan = c_max - c0 + 1
            rowspan = r_max - r0 + 1
            cell_bbox = [int(c_box.x1), int(c_box.y1), int(c_box.x2), int(c_box.y2)]

            for r, c in positions:
                is_origin = r == r0 and c == c0
                grid[r][c] = text if is_origin else ""
                confs[r][c] = avg_conf
                bboxes[r][c] = cell_bbox
                spans[(r, c)] = (colspan if is_origin else 1, rowspan if is_origin else 1, not is_origin)

        return grid, confs, bboxes, spans

    def _extract_bordered_tables(
        self, image_np: np.ndarray, ocr_words: List[_OcrWord], img_w: int, img_h: int
    ) -> Tuple[List[Tuple[int, int, int, int, ExtractedTable]], List[Tuple[int, int, int, int]]]:
        from img2table.tables.extractor import TableExtractor
        from img2table.tables.bordered.cells import get_cells
        from img2table.tables.bordered.tables.creation.cell_clustering import cluster_cells_in_tables
        from img2table.tables.bordered.tables.creation.creation import cluster_to_table
        from img2table.tables.bordered.tables.normalization import normalize_table_cells
        from img2table.tables.bordered.tables.misc.semi_bordered import add_semi_bordered_cells
        from img2table.tables.types import Cell

        ocr_cells = [Cell(x1=w.x1, y1=w.y1, x2=w.x2, y2=w.y2) for w in ocr_words]
        te = TableExtractor(img=image_np)
        if te.characteristics is None or not te.characteristics.char_length:
            return [], []
        raw_cells = get_cells(te.horizontal_lines, te.vertical_lines)
        clean_cells = self._filter_non_table_cells(raw_cells, ocr_words, img_w, img_h)
        clusters = cluster_cells_in_tables(cells=clean_cells)

        candidates: List[Tuple[int, int, int, int, ExtractedTable]] = []
        covered: List[Tuple[int, int, int, int]] = []

        for cl in clusters:
            if len(cl) < 4:
                continue
            norm = normalize_table_cells(cl, te.characteristics.char_length)
            semi = add_semi_bordered_cells(norm, te.lines, te.characteristics.char_length)
            tb = cluster_to_table(semi, te.characteristics.contours + ocr_cells)
            if not (tb.has_valid_shape() and tb.nb_rows >= 2 and tb.nb_columns >= 2):
                continue

            grid, confs, bboxes, spans = self._assign_words_to_bordered_table(tb, ocr_words)
            kv_only = tb.nb_columns == 2 and _is_key_value_table(grid)
            promote_header = not kv_only

            headers = grid[0] if promote_header else []
            rows = grid[1:] if promote_header else grid

            cells: List[TableCell] = []
            for r_idx in range(tb.nb_rows):
                for c_idx in range(tb.nb_columns):
                    colspan, rowspan, _ = spans.get((r_idx, c_idx), (1, 1, False))
                    cells.append(
                        TableCell(
                            row_idx=r_idx,
                            col_idx=c_idx,
                            text=grid[r_idx][c_idx],
                            confidence=max(0.0, min(1.0, confs[r_idx][c_idx])),
                            bbox=bboxes[r_idx][c_idx],
                            is_header=bool(promote_header and r_idx == 0),
                            colspan=colspan,
                            rowspan=rowspan,
                        )
                    )

            outer_bbox = [int(tb.x1), int(tb.y1), int(tb.x2), int(tb.y2)]
            covered.append((int(tb.x1), int(tb.y1), int(tb.x2), int(tb.y2)))
            candidates.append(
                (
                    int(tb.x1),
                    int(tb.y1),
                    int(tb.x2),
                    int(tb.y2),
                    ExtractedTable(
                        table_idx=0,
                        headers=headers,
                        rows=rows,
                        cells=cells,
                        num_rows=len(rows),
                        num_cols=tb.nb_columns,
                        bbox=outer_bbox,
                    ),
                )
            )

        return candidates, covered

    def _extract_borderless_tables(
        self,
        ocr_words: List[_OcrWord],
        covered_bboxes: List[Tuple[int, int, int, int]],
        img_w: int,
    ) -> List[Tuple[int, int, int, int, ExtractedTable]]:
        free_words: List[_OcrWord] = []
        for w in ocr_words:
            if w.conf < 0.30 or w.height < 10:
                continue
            if len(w.text) <= 1 and w.conf < 0.60:
                continue
            if any(bx1 <= w.xc <= bx2 and by1 <= w.yc <= by2 for bx1, by1, bx2, by2 in covered_bboxes):
                continue
            free_words.append(w)

        if len(free_words) < 4:
            return []

        sorted_w = sorted(free_words, key=lambda w: w.yc)
        median_h = float(np.median([w.height for w in sorted_w]))
        visual_rows: List[List[_OcrWord]] = []
        for w in sorted_w:
            placed = False
            for row in reversed(visual_rows[-5:]):
                row_yc = float(np.mean([x.yc for x in row]))
                row_h = float(np.mean([x.height for x in row]))
                if abs(w.yc - row_yc) <= 0.55 * max(row_h, w.height):
                    row.append(w)
                    placed = True
                    break
            if not placed:
                visual_rows.append([w])

        visual_rows.sort(key=lambda r: float(np.mean([w.y1 for w in r])))
        for row in visual_rows:
            row.sort(key=lambda w: w.x1)

        def coarse_row_len(row: List[_OcrWord]) -> int:
            cnt = 1
            for i in range(1, len(row)):
                gap = row[i].x1 - row[i - 1].x2
                rh = 0.5 * (row[i].height + row[i - 1].height)
                if gap > 0.35 * rh:
                    cnt += 1
            return cnt

        blocks_raw: List[List[List[_OcrWord]]] = []
        cur_block: List[List[_OcrWord]] = []
        for row in visual_rows:
            if coarse_row_len(row) < 2:
                if len(cur_block) >= 2:
                    blocks_raw.append(cur_block)
                cur_block = []
                continue
            if cur_block:
                prev_y2 = max(w.y2 for w in cur_block[-1])
                cur_y1 = min(w.y1 for w in row)
                if cur_y1 - prev_y2 > 2.2 * median_h:
                    if len(cur_block) >= 2:
                        blocks_raw.append(cur_block)
                    cur_block = []
            cur_block.append(row)
        if len(cur_block) >= 2:
            blocks_raw.append(cur_block)

        candidates: List[Tuple[int, int, int, int, ExtractedTable]] = []
        x1_tol = max(30.0, 0.015 * img_w)
        col_tol = max(35.0, 0.02 * img_w)

        for raw_block in blocks_raw:
            block_x1s = [w.x1 for row in raw_block for w in row]
            min_anchor_cnt = max(2, len(raw_block)) if len(raw_block) <= 3 else 3

            def is_local_anchor(x1_val: int) -> bool:
                return sum(1 for x in block_x1s if abs(x - x1_val) <= x1_tol) >= min_anchor_cnt

            # Pass 1: anchor-aware merge to discover column boundaries
            pass1: List[List[_OcrWord]] = []
            for row in raw_block:
                cur = [row[0]]
                for w in row[1:]:
                    prev = cur[-1]
                    gap = w.x1 - prev.x2
                    rh = 0.5 * (prev.height + w.height)
                    if gap <= 0.75 * rh and not is_local_anchor(w.x1):
                        cur[-1] = _OcrWord(
                            x1=min(prev.x1, w.x1),
                            y1=min(prev.y1, w.y1),
                            x2=max(prev.x2, w.x2),
                            y2=max(prev.y2, w.y2),
                            text=f"{prev.text} {w.text}".strip(),
                            conf=(prev.conf + w.conf) / 2.0,
                        )
                    else:
                        cur.append(w)
                pass1.append(cur)

            pass1_tokens = [w for row in pass1 for w in row]
            p1_x1s = sorted(w.x1 for w in pass1_tokens)
            p1_clusters = [[p1_x1s[0]]]
            for x in p1_x1s[1:]:
                if x - float(np.mean(p1_clusters[-1])) <= col_tol:
                    p1_clusters[-1].append(x)
                else:
                    p1_clusters.append([x])
            col_starts = sorted(float(np.mean(c)) for c in p1_clusters if len(c) >= 2)
            if len(col_starts) < 2:
                continue

            def crosses_col_boundary(x_left: int, x_right: int) -> bool:
                for cs in col_starts[1:]:
                    if x_left < cs - x1_tol <= x_right:
                        return True
                return False

            # Pass 2: merge adjacent tokens unless separated by wide gap, local anchor, or column boundary
            block: List[List[_OcrWord]] = []
            for row in raw_block:
                cur = [row[0]]
                for w in row[1:]:
                    prev = cur[-1]
                    gap = w.x1 - prev.x2
                    rh = 0.5 * (prev.height + w.height)
                    if gap <= 0.75 * rh and not is_local_anchor(w.x1) and not crosses_col_boundary(prev.x1, w.x1):
                        cur[-1] = _OcrWord(
                            x1=min(prev.x1, w.x1),
                            y1=min(prev.y1, w.y1),
                            x2=max(prev.x2, w.x2),
                            y2=max(prev.y2, w.y2),
                            text=f"{prev.text} {w.text}".strip(),
                            conf=(prev.conf + w.conf) / 2.0,
                        )
                    else:
                        cur.append(w)
                block.append(cur)

            if sum(1 for r in block if len(r) >= 2) < 2:
                continue

            row_heights = [max(w.height for w in row) for row in block]
            if max(row_heights) > 2.2 * min(row_heights):
                continue

            tokens = [w for row in block for w in row]
            if float(np.mean([w.conf for w in tokens])) < 0.55:
                continue

            x1s_sorted = sorted(w.x1 for w in tokens)
            col_clusters = [[x1s_sorted[0]]]
            for x in x1s_sorted[1:]:
                if x - float(np.mean(col_clusters[-1])) <= col_tol:
                    col_clusters[-1].append(x)
                else:
                    col_clusters.append([x])

            strong_cols = [float(np.mean(c)) for c in col_clusters if len(c) >= 2]
            if len(strong_cols) < 2:
                continue

            n_cols = len(strong_cols)
            col_tokens: List[List[Tuple[int, _OcrWord]]] = [[] for _ in range(n_cols)]
            for r_idx, row in enumerate(block):
                used_cols = set()
                for w in row:
                    best_c = min(range(n_cols), key=lambda ci: abs(strong_cols[ci] - w.x1))
                    if best_c in used_cols and best_c + 1 < n_cols:
                        for nxt in range(best_c + 1, n_cols):
                            if nxt not in used_cols:
                                best_c = nxt
                                break
                    used_cols.add(best_c)
                    col_tokens[best_c].append((r_idx, w))

            # Consolidate mutually-exclusive horizontally overlapping columns (e.g. indented sub-labels)
            merged_cols: List[List[Tuple[int, _OcrWord]]] = [col_tokens[0]]
            for ci in range(1, n_cols):
                prev_items = merged_cols[-1]
                cur_items = col_tokens[ci]
                prev_rows = {r for r, _ in prev_items}
                cur_rows = {r for r, _ in cur_items}
                prev_x2_med = float(np.median([w.x2 for _, w in prev_items])) if prev_items else 0.0
                cur_x1_med = float(np.median([w.x1 for _, w in cur_items])) if cur_items else 0.0
                if prev_rows.isdisjoint(cur_rows) and cur_x1_med <= prev_x2_med + 0.5 * median_h:
                    merged_cols[-1].extend(cur_items)
                else:
                    merged_cols.append(cur_items)

            final_n_cols = len(merged_cols)
            if final_n_cols < 2:
                continue

            matrix = [["" for _ in range(final_n_cols)] for _ in range(len(block))]
            cell_word_map: Dict[Tuple[int, int], List[_OcrWord]] = {}
            for ci, items in enumerate(merged_cols):
                for r_idx, w in sorted(items, key=lambda t: (t[0], t[1].x1)):
                    cell_word_map.setdefault((r_idx, ci), []).append(w)
                    matrix[r_idx][ci] = f"{matrix[r_idx][ci]} {w.text}".strip() if matrix[r_idx][ci] else w.text

            non_empty = [cell for row in matrix for cell in row if cell]
            if not non_empty or max(len(c) for c in non_empty) <= 3:
                continue

            if sum(1 for r in matrix if sum(1 for cell in r if cell) >= 2) < 2:
                continue

            kv = _is_key_value_table(matrix)
            promote_header = not kv
            headers = matrix[0] if promote_header else []
            rows = matrix[1:] if promote_header else matrix

            cells: List[TableCell] = []
            for r_idx in range(len(matrix)):
                for c_idx in range(final_n_cols):
                    words_in_cell = cell_word_map.get((r_idx, c_idx), [])
                    if words_in_cell:
                        c_conf = float(np.mean([w.conf for w in words_in_cell]))
                        c_bbox = [
                            min(w.x1 for w in words_in_cell),
                            min(w.y1 for w in words_in_cell),
                            max(w.x2 for w in words_in_cell),
                            max(w.y2 for w in words_in_cell),
                        ]
                    else:
                        c_conf = 1.0
                        c_bbox = None
                    cells.append(
                        TableCell(
                            row_idx=r_idx,
                            col_idx=c_idx,
                            text=matrix[r_idx][c_idx],
                            confidence=max(0.0, min(1.0, c_conf)),
                            bbox=c_bbox,
                            is_header=bool(promote_header and r_idx == 0),
                        )
                    )

            bx1 = min(w.x1 for w in tokens)
            by1 = min(w.y1 for w in tokens)
            bx2 = max(w.x2 for w in tokens)
            by2 = max(w.y2 for w in tokens)
            candidates.append(
                (
                    bx1,
                    by1,
                    bx2,
                    by2,
                    ExtractedTable(
                        table_idx=0,
                        headers=headers,
                        rows=rows,
                        cells=cells,
                        num_rows=len(rows),
                        num_cols=final_n_cols,
                        bbox=[bx1, by1, bx2, by2],
                    ),
                )
            )

        return candidates

    def _extract_from_img2table_fallback(
        self, doc, ocr_wrapper, borderless: bool
    ) -> List[ExtractedTable]:
        extracted = doc.extract_tables(
            ocr=ocr_wrapper,
            implicit_rows=borderless,
            borderless_tables=borderless,
            min_confidence=30,
        )

        tables: List[ExtractedTable] = []
        for idx, tbl in enumerate(extracted):
            headers: List[str] = []
            rows: List[List[str]] = []
            promoted_header = False
            try:
                df = tbl.df
                headers = [str(col).strip() for col in df.columns]
                rows = [
                    [str(val).strip() if val is not None else "" for val in row]
                    for row in df.values.tolist()
                ]
                if (
                    len(df.columns) > 0
                    and all(isinstance(c, int) or str(c).isdigit() for c in df.columns)
                    and len(rows) >= 1
                ):
                    headers = rows.pop(0)
                    promoted_header = True
            except Exception:
                pass

            content = getattr(tbl, "content", {})
            if not rows and isinstance(content, dict) and content:
                for row_cells in content.values():
                    row_vals = [
                        str(getattr(cell, "value", None) or getattr(cell, "text", "") or "").strip()
                        for cell in row_cells
                    ]
                    if not headers:
                        headers = row_vals
                        promoted_header = True
                    else:
                        rows.append(row_vals)

            cells: List[TableCell] = []
            if isinstance(content, dict):
                for r_idx, row_cells in content.items():
                    for c_idx, cell in enumerate(row_cells):
                        cell_bbox = (
                            [cell.bbox.x1, cell.bbox.y1, cell.bbox.x2, cell.bbox.y2]
                            if hasattr(cell, "bbox") and cell.bbox
                            else None
                        )
                        raw_conf = getattr(cell, "confidence", 100)
                        cell_conf = max(0.0, min(1.0, float(raw_conf if raw_conf is not None else 100) / 100.0))
                        cell_row_idx = getattr(cell, "row", int(r_idx))
                        cells.append(
                            TableCell(
                                row_idx=cell_row_idx,
                                col_idx=getattr(cell, "col", int(c_idx)),
                                text=str(getattr(cell, "value", None) or getattr(cell, "text", "") or "").strip(),
                                confidence=cell_conf,
                                bbox=cell_bbox,
                                is_header=bool(promoted_header and cell_row_idx == 0),
                            )
                        )
            elif hasattr(tbl, "cells"):
                for cell in getattr(tbl, "cells", []):
                    raw_conf = getattr(cell, "confidence", 100)
                    cell_conf = max(0.0, min(1.0, float(raw_conf if raw_conf is not None else 100) / 100.0))
                    cell_row_idx = getattr(cell, "row", 0)
                    cells.append(
                        TableCell(
                            row_idx=cell_row_idx,
                            col_idx=getattr(cell, "col", 0),
                            text=str(getattr(cell, "value", None) or getattr(cell, "text", "") or "").strip(),
                            confidence=cell_conf,
                            bbox=[cell.bbox.x1, cell.bbox.y1, cell.bbox.x2, cell.bbox.y2]
                            if hasattr(cell, "bbox") and cell.bbox
                            else None,
                            is_header=bool(promoted_header and cell_row_idx == 0),
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

        return tables

    def extract_tables_from_image(
        self,
        image_np: np.ndarray,
        borderless: bool = True,
        mock_tables: Optional[List[ExtractedTable]] = None,
    ) -> Tuple[TableExtractionResult, List[Finding]]:
        """Extracts structured 2D tables using hybrid bordered line clustering and OCR-geometry alignment."""
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

        try:
            from img2table.document import Image as Img2TableImage

            success, encoded_img = cv2.imencode(".png", image_np)
            if not success:
                raise ValueError("Failed to encode image array for table extraction")

            reader = self._get_reader()
            ocr_wrapper = self._build_ocr_wrapper(reader)
            doc = Img2TableImage(encoded_img.tobytes(), detect_rotation=True)

            doc_images = getattr(doc, "images", None)
            if isinstance(doc_images, list) and len(doc_images) > 0:
                rotated_img = doc_images[0]
                img_h, img_w = rotated_img.shape[:2]
                ocr_words = self._extract_ocr_words(rotated_img, reader)

                candidates, covered = self._extract_bordered_tables(rotated_img, ocr_words, img_w, img_h)
                if borderless:
                    candidates.extend(self._extract_borderless_tables(ocr_words, covered, img_w))

                # Sort tables in natural top-to-bottom, left-to-right reading order
                candidates.sort(key=lambda item: (item[1], item[0]))
                tables: List[ExtractedTable] = []
                for idx, (_, _, _, _, tbl) in enumerate(candidates):
                    tbl.table_idx = idx
                    tables.append(tbl)
            else:
                tables = self._extract_from_img2table_fallback(doc, ocr_wrapper, borderless)

            raw_lines: List[str] = []
            for tbl in tables:
                if tbl.headers:
                    raw_lines.append("\t".join(tbl.headers))
                for row in tbl.rows:
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
