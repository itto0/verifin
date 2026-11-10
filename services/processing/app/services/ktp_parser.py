from datetime import datetime
import re
from typing import Any, Dict, List, Optional, Tuple
from app.schemas.common import Finding
from app.schemas.ocr import KTPFieldExtraction, KTPValidationResult

# Recognized 2-digit Indonesian province codes according to Kemendagri / Dukcapil
INDONESIAN_PROVINCES = {
    "11": "ACEH", "12": "SUMATERA UTARA", "13": "SUMATERA BARAT", "14": "RIAU",
    "15": "JAMBI", "16": "SUMATERA SELATAN", "17": "BENGKULU", "18": "LAMPUNG",
    "19": "KEPULAUAN BANGKA BELITUNG", "21": "KEPULAUAN RIAU", "31": "DKI JAKARTA",
    "32": "JAWA BARAT", "33": "JAWA TENGAH", "34": "DAERAH ISTIMEWA YOGYAKARTA",
    "35": "JAWA TIMUR", "36": "BANTEN", "51": "BALI", "52": "NUSA TENGGARA BARAT",
    "53": "NUSA TENGGARA TIMUR", "61": "KALIMANTAN BARAT", "62": "KALIMANTAN TENGAH",
    "63": "KALIMANTAN SELATAN", "64": "KALIMANTAN TIMUR", "65": "KALIMANTAN UTARA",
    "71": "SULAWESI UTARA", "72": "SULAWESI TENGAH", "73": "SULAWESI SELATAN",
    "74": "SULAWESI TENGGARA", "75": "GORONTALO", "76": "SULAWESI BARAT",
    "81": "MALUKU", "82": "MALUKU UTARA", "91": "PAPUA BARAT", "92": "PAPUA",
    "93": "PAPUA SELATAN", "94": "PAPUA TENGAH", "95": "PAPUA PEGUNUNGAN", "96": "PAPUA BARAT DAYA",
}


def parse_nik_date(date_code: str) -> Tuple[bool, Optional[str], Optional[str], Optional[Finding]]:
    """Decodes 6-digit DDMMYY from NIK handling female +40 day offset."""
    if len(date_code) != 6 or not date_code.isdigit():
        return False, None, None, Finding(
            type="INVALID_NIK_DATE",
            severity="high",
            description="NIK date portion must be 6 digits",
            field_ref="nik",
        )

    raw_day = int(date_code[0:2])
    month = int(date_code[2:4])
    year_short = int(date_code[4:6])

    if raw_day > 40:
        gender = "PEREMPUAN"
        day = raw_day - 40
    else:
        gender = "LAKI-LAKI"
        day = raw_day

    if month < 1 or month > 12 or day < 1 or day > 31:
        return False, None, None, Finding(
            type="INVALID_NIK_DATE",
            severity="high",
            description=f"NIK date is out of range: day={day}, month={month}",
            field_ref="nik",
        )

    current_year_short = int(datetime.now().strftime("%y")) - 17
    full_year = 1900 + year_short if year_short > current_year_short else 2000 + year_short

    try:
        dt = datetime(full_year, month, day)
        return True, gender, dt.strftime("%Y-%m-%d"), None
    except ValueError as e:
        return False, None, None, Finding(
            type="INVALID_NIK_DATE",
            severity="high",
            description=f"Invalid calendar date in NIK: {e}",
            field_ref="nik",
        )


def validate_nik(nik_input: Optional[str]) -> KTPValidationResult:
    """Validates 16-digit Dukcapil NIK according to civil registry algorithms."""
    findings: List[Finding] = []
    if not nik_input:
        return KTPValidationResult(
            is_valid=False,
            findings=[Finding(type="MISSING_NIK", severity="critical", description="NIK is missing", field_ref="nik")],
        )

    clean_nik = re.sub(r"\D", "", nik_input)
    if len(clean_nik) != 16:
        return KTPValidationResult(
            is_valid=False,
            findings=[
                Finding(
                    type="INVALID_NIK_LENGTH",
                    severity="critical",
                    description=f"NIK must be exactly 16 digits, got {len(clean_nik)}",
                    field_ref="nik",
                )
            ],
        )

    prov_code = clean_nik[0:2]
    reg_code = clean_nik[2:4]
    dist_code = clean_nik[4:6]
    date_code = clean_nik[6:12]
    seq_code = clean_nik[12:16]

    if prov_code not in INDONESIAN_PROVINCES:
        findings.append(
            Finding(
                type="INVALID_PROVINCE_CODE",
                severity="high",
                description=f"Province code '{prov_code}' is not recognized in Dukcapil registry",
                field_ref="nik",
            )
        )

    if reg_code == "00":
        findings.append(
            Finding(
                type="INVALID_REGENCY_CODE",
                severity="high",
                description="Regency code '00' is invalid in Dukcapil specification",
                field_ref="nik",
            )
        )

    if dist_code == "00":
        findings.append(
            Finding(
                type="INVALID_DISTRICT_CODE",
                severity="high",
                description="District code '00' is invalid in Dukcapil specification",
                field_ref="nik",
            )
        )

    date_valid, gender, birth_date, date_finding = parse_nik_date(date_code)
    if date_finding:
        findings.append(date_finding)

    if seq_code == "0000":
        findings.append(
            Finding(
                type="INVALID_SEQUENCE_NUMBER",
                severity="high",
                description="Sequence number '0000' is invalid in Dukcapil specification",
                field_ref="nik",
            )
        )

    is_valid = len(findings) == 0
    return KTPValidationResult(
        is_valid=is_valid,
        province_code=prov_code,
        regency_code=reg_code,
        district_code=dist_code,
        gender=gender,
        birth_date_str=birth_date,
        sequence=seq_code,
        findings=findings,
    )


def cross_validate_ktp(fields: KTPFieldExtraction) -> KTPValidationResult:
    """Performs tamper cross-checking between NIK and plain text fields."""
    validation = validate_nik(fields.nik)
    tamper_findings: List[Finding] = list(validation.findings)
    tamper_score = 0.0

    if validation.is_valid:
        # Cross-check Gender
        if fields.jenis_kelamin:
            clean_gender = fields.jenis_kelamin.upper().strip()
            if "LAKI" in clean_gender and validation.gender != "LAKI-LAKI":
                tamper_score += 70.0
                tamper_findings.append(
                    Finding(
                        type="NIK_GENDER_MISMATCH",
                        severity="high",
                        description=f"Gender in text ('{fields.jenis_kelamin}') mismatches NIK decoded gender ('{validation.gender}')",
                        field_ref="jenis_kelamin",
                    )
                )
            elif "PEREMPUAN" in clean_gender and validation.gender != "PEREMPUAN":
                tamper_score += 70.0
                tamper_findings.append(
                    Finding(
                        type="NIK_GENDER_MISMATCH",
                        severity="high",
                        description=f"Gender in text ('{fields.jenis_kelamin}') mismatches NIK decoded gender ('{validation.gender}')",
                        field_ref="jenis_kelamin",
                    )
                )

        # Cross-check Birth Date
        if fields.tgl_lahir and validation.birth_date_str:
            norm_text_date = re.sub(r"[\s/.-]", "", fields.tgl_lahir)
            # Check if day and month match
            if validation.birth_date_str not in fields.tgl_lahir:
                # Also test reversed format DD-MM-YYYY
                nik_dt = datetime.strptime(validation.birth_date_str, "%Y-%m-%d")
                dmy_str = nik_dt.strftime("%d-%m-%Y")
                dmy_compact = nik_dt.strftime("%d%m%Y")
                if dmy_str not in fields.tgl_lahir and dmy_compact not in norm_text_date:
                    tamper_score += 70.0
                    tamper_findings.append(
                        Finding(
                            type="NIK_BIRTHDATE_MISMATCH",
                            severity="high",
                            description=f"Birth date in text ('{fields.tgl_lahir}') mismatches NIK decoded date ('{validation.birth_date_str}')",
                            field_ref="tgl_lahir",
                        )
                    )

    validation.tamper_score = min(tamper_score, 100.0)
    validation.findings = tamper_findings
    validation.is_valid = len(tamper_findings) == 0 and validation.tamper_score < 70.0
    return validation


class _OCRBox:
    """Internal geometric container for parsed OCR lines."""

    def __init__(self, text: str, confidence: Optional[float] = 1.0, bbox: Optional[List[Any]] = None, index: int = 0):
        self.text = text.strip()
        self.confidence = max(0.0, min(1.0, float(confidence or 1.0)))
        self.bbox = bbox
        self.index = index
        self.has_bbox = False
        self.min_x = 0.0
        self.max_x = 0.0
        self.min_y = 0.0
        self.max_y = 0.0
        self.center_y = 0.0
        self.height = 0.0
        self.width = 0.0

        if bbox and isinstance(bbox, (list, tuple)) and len(bbox) >= 3:
            try:
                xs = [float(pt[0]) for pt in bbox if len(pt) >= 2]
                ys = [float(pt[1]) for pt in bbox if len(pt) >= 2]
                if xs and ys:
                    self.min_x = min(xs)
                    self.max_x = max(xs)
                    self.min_y = min(ys)
                    self.max_y = max(ys)
                    self.center_y = (self.min_y + self.max_y) / 2.0
                    self.height = max(self.max_y - self.min_y, 1.0)
                    self.width = max(self.max_x - self.min_x, 1.0)
                    self.has_bbox = True
            except (ValueError, TypeError, IndexError):
                self.has_bbox = False


def _clean_val(val: str) -> str:
    """Strips leading/trailing delimiters while preserving internal slashes or punctuation."""
    v = re.sub(r"^[:;.\-\s]+", "", val)
    v = re.sub(r"[:;\s]+$", "", v)
    return v.strip()


def _normalize_gender(raw: str) -> str:
    """Normalizes gender string and strips blood type artifact if present."""
    cleaned = re.sub(r"(?:Gol\.?|Golongan)?\s*Darah.*$", "", raw, flags=re.IGNORECASE).strip()
    upper = cleaned.upper()
    if "LAKI" in upper:
        return "LAKI-LAKI"
    elif "PEREMPUAN" in upper:
        return "PEREMPUAN"
    return cleaned


def _normalize_ttl(raw: str) -> Tuple[Optional[str], Optional[str]]:
    """Splits Tempat/Tgl Lahir into city and birth date."""
    val = raw.strip()
    if "," in val:
        parts = val.split(",", 1)
        city = parts[0].strip(":;.- ")
        date_str = parts[1].strip(":;.- ")
        date_str = re.sub(r"[./]", "-", date_str)
        return city or None, date_str or None

    m = re.search(r"(\d{2}[-/.]\d{2}[-/.]\d{4})", val)
    if m:
        date_str = m.group(1).replace(".", "-").replace("/", "-")
        city = val[: m.start()].strip(":;.,- ")
        return city or None, date_str or None

    cleaned_val = val.strip(":;.- ")
    if not re.search(r"\d", cleaned_val):
        return cleaned_val or None, None
    return None, cleaned_val or None


def _is_system_or_label(text: str) -> bool:
    """Checks whether the text matches standard e-KTP headers or field labels."""
    t = text.strip()
    patterns = [
        r"^(?:REPUBLIK|REPUBLIC)\s*INDONESIA\b",
        r"^PROVINSI\b",
        r"^(?:KABUPATEN|KOTA)\s+ADM\b",
        r"^NIK\b",
        r"^Nama\b",
        r"^Tempat.*Lahir\b",
        r"^Jenis\s*Kelamin\b",
        r"^(?:Gol\.?|Golongan)?\s*Darah\b",
        r"^Alamat\b",
        r"^RT\s*[/I|\\l\s.]?\s*RW\b",
        r"^Kel+[/I|\\l\s.:]*Desa\b",
        r"^Kecamatan\b",
        r"^Agama\b",
        r"^Status\s*(?:Per)?kawinan\b",
        r"^Pekerjaan\b",
        r"^Kewarganegaraan\b",
        r"^Berlaku\s*(?:.*Hingga)?\b",
        r"^SURAT\b",
        r"^KARTU\s*TANDA\s*PENDUDUK\b",
    ]
    for p in patterns:
        if re.search(p, t, re.IGNORECASE):
            return True
    if re.search(r"^(?:KABUPATEN|KOTA)\b", t, re.IGNORECASE) and not re.search(r"\d", t) and "," not in t:
        return True
    return False


FIELD_SPECS = [
    {"key": "nik", "label_pat": r"NIK"},
    {"key": "nama", "label_pat": r"Nama"},
    {"key": "ttl", "label_pat": r"Tempat.*Lahir"},
    {"key": "jenis_kelamin", "label_pat": r"Jenis\s*Kelamin"},
    {"key": "alamat", "label_pat": r"Alamat"},
    {"key": "rt_rw", "label_pat": r"RT\s*[/I|\\l\s.]?\s*RW"},
    {"key": "kel_desa", "label_pat": r"Kel+[/I|\\l\s.:]*Desa"},
    {"key": "kecamatan", "label_pat": r"Kecamatan"},
    {"key": "agama", "label_pat": r"Agama"},
    {"key": "status_perkawinan", "label_pat": r"Status\s*(?:Per)?kawinan"},
    {"key": "pekerjaan", "label_pat": r"Pekerjaan"},
    {"key": "kewarganegaraan", "label_pat": r"Kewarganegaraan"},
    {"key": "berlaku_hingga", "label_pat": r"Berlaku\s*(?:Hingga|s/?d|.*Hingga)"},
]


def _match_inline(box_text: str, label_pat: str) -> Optional[str]:
    """Matches 'Label : Value' or 'Label Value' on the same line."""
    m = re.search(rf"^\s*{label_pat}\s*[:;.]\s*(.*)$", box_text, re.IGNORECASE)
    if m:
        val = _clean_val(m.group(1))
        if val and not _is_system_or_label(val):
            return val
    m2 = re.search(rf"^\s*{label_pat}\s+(.*)$", box_text, re.IGNORECASE)
    if m2:
        val = _clean_val(m2.group(1))
        if val and not _is_system_or_label(val):
            return val
    return None


def _match_standalone(box_text: str, label_pat: str) -> bool:
    """Matches standalone label without value (e.g. 'Nama' or 'Nama :')."""
    return bool(re.search(rf"^\s*{label_pat}\s*[:;.]?\s*$", box_text, re.IGNORECASE))


def _assign_field_value(
    fields: KTPFieldExtraction,
    field_key: str,
    raw_val: str,
    conf: float,
) -> bool:
    """Normalizes and assigns extracted text to corresponding KTP fields."""
    val = _clean_val(raw_val)
    if not val:
        return False

    bounded_conf = round(max(0.0, min(1.0, float(conf))), 4)

    if field_key == "nik":
        clean_nik = re.sub(r"\D", "", val)
        if len(clean_nik) == 16:
            fields.nik = clean_nik
            fields.field_confidences["nik"] = bounded_conf
            return True
        return False

    elif field_key == "nama":
        fields.nama = val
        fields.field_confidences["nama"] = bounded_conf
        return True

    elif field_key == "ttl":
        city, date_str = _normalize_ttl(val)
        if date_str:
            fields.tgl_lahir = date_str
            fields.field_confidences["tgl_lahir"] = bounded_conf
        if city:
            fields.tempat_lahir = city
            fields.field_confidences["tempat_lahir"] = bounded_conf
        return bool(date_str or city)

    elif field_key == "jenis_kelamin":
        gender = _normalize_gender(val)
        fields.jenis_kelamin = gender
        fields.field_confidences["jenis_kelamin"] = bounded_conf
        return True

    elif field_key == "alamat":
        fields.alamat = val
        fields.field_confidences["alamat"] = bounded_conf
        return True

    elif field_key == "rt_rw":
        fields.rt_rw = val
        fields.field_confidences["rt_rw"] = bounded_conf
        return True

    elif field_key == "kel_desa":
        fields.kel_desa = val
        fields.field_confidences["kel_desa"] = bounded_conf
        return True

    elif field_key == "kecamatan":
        fields.kecamatan = val
        fields.field_confidences["kecamatan"] = bounded_conf
        return True

    elif field_key == "agama":
        fields.agama = val
        fields.field_confidences["agama"] = bounded_conf
        return True

    elif field_key == "status_perkawinan":
        fields.status_perkawinan = val
        fields.field_confidences["status_perkawinan"] = bounded_conf
        return True

    elif field_key == "pekerjaan":
        fields.pekerjaan = val
        fields.field_confidences["pekerjaan"] = bounded_conf
        return True

    elif field_key == "kewarganegaraan":
        fields.kewarganegaraan = val
        fields.field_confidences["kewarganegaraan"] = bounded_conf
        return True

    elif field_key == "berlaku_hingga":
        fields.berlaku_hingga = val
        fields.field_confidences["berlaku_hingga"] = bounded_conf
        return True

    return False


def _is_field_resolved(fields: KTPFieldExtraction, field_key: str) -> bool:
    """Checks whether the field is already populated."""
    if field_key == "nik":
        return fields.nik is not None
    if field_key == "ttl":
        return fields.tgl_lahir is not None and fields.tempat_lahir is not None
    return getattr(fields, field_key, None) is not None


def extract_ktp_fields_from_ocr(lines: List[Any]) -> KTPFieldExtraction:
    """Parses OCR lines using two-tier spatial row pairing and sequential fallback for Indonesian e-KTP layout."""
    fields = KTPFieldExtraction()

    # 1. Normalize lines into _OCRBox objects
    boxes: List[_OCRBox] = []
    for idx, line in enumerate(lines):
        if hasattr(line, "text"):
            txt = str(line.text).strip()
            conf = float(getattr(line, "confidence", 1.0) or 1.0)
            bbox = getattr(line, "bbox", None)
        elif isinstance(line, (list, tuple)) and len(line) >= 2:
            txt = str(line[0]).strip()
            conf = float(line[1] or 1.0)
            bbox = line[2] if len(line) >= 3 else None
        else:
            txt = str(line).strip()
            conf = 1.0
            bbox = None
        if txt:
            boxes.append(_OCRBox(text=txt, confidence=conf, bbox=bbox, index=idx))

    if not boxes:
        return fields

    # 2. Extract NIK first
    for box in boxes:
        m = re.search(r"\b(\d{16})\b", box.text)
        if m and not fields.nik:
            fields.nik = m.group(1)
            fields.field_confidences["nik"] = round(box.confidence, 4)
            break
        m2 = re.search(r"NIK\s*[:;.]?\s*([0-9Xx\s]{16,24})", box.text, re.IGNORECASE)
        if m2 and not fields.nik:
            cleaned = re.sub(r"\D", "", m2.group(1))
            if len(cleaned) == 16:
                fields.nik = cleaned
                fields.field_confidences["nik"] = round(box.confidence, 4)
                break

    # 3. For each field definition, apply two-tier matching
    for spec in FIELD_SPECS:
        key = spec["key"]
        lbl_pat = spec["label_pat"]

        if _is_field_resolved(fields, key):
            continue

        resolved = False

        # Step A: Inline matching
        for box in boxes:
            inline_val = _match_inline(box.text, lbl_pat)
            if inline_val:
                if _assign_field_value(fields, key, inline_val, box.confidence):
                    resolved = True
                    break

        if resolved or _is_field_resolved(fields, key):
            continue

        # Step B: Spatial Row Pairing
        label_box: Optional[_OCRBox] = None
        label_box_idx: int = -1
        for b_i, box in enumerate(boxes):
            if _match_standalone(box.text, lbl_pat):
                label_box = box
                label_box_idx = b_i
                break

        if label_box and label_box.has_bbox:
            candidate_boxes = []
            for c in boxes:
                if c.index == label_box.index or not c.has_bbox:
                    continue
                # Discard delimiter-only boxes like ':' or ';'
                if not _clean_val(c.text):
                    continue
                # Must be horizontally to the right of label
                if c.min_x < label_box.max_x - 15:
                    continue
                # Vertical overlap check (same row: center_y difference within tolerance)
                y_diff = abs(c.center_y - label_box.center_y)
                tolerance = max(label_box.height, c.height) * 0.7
                if y_diff > tolerance:
                    continue
                # Filter out system headers and recognized labels
                if _is_system_or_label(c.text):
                    continue
                # For gender, filter out blood type if present
                if key == "jenis_kelamin" and re.search(r"(?:Gol\.?|Golongan)?\s*Darah\b", c.text, re.IGNORECASE):
                    continue
                candidate_boxes.append(c)

            if candidate_boxes:
                # Sort candidates by min_x ascending
                candidate_boxes.sort(key=lambda b: b.min_x)
                # Cluster horizontally adjacent words in the same field
                clustered = [candidate_boxes[0]]
                for next_box in candidate_boxes[1:]:
                    gap = next_box.min_x - clustered[-1].max_x
                    max_gap = max(label_box.height, clustered[-1].height) * 1.8
                    max_overlap = -max(clustered[-1].height, next_box.height) * 0.5
                    if max_overlap <= gap <= max_gap:
                        clustered.append(next_box)
                    else:
                        break

                combined_text = " ".join(b.text for b in clustered)
                avg_conf = sum(b.confidence for b in clustered) / len(clustered)
                if _assign_field_value(fields, key, combined_text, avg_conf):
                    resolved = True

        if resolved or _is_field_resolved(fields, key):
            continue

        # Step C: Sequential Adjacency Fallback
        if label_box_idx >= 0:
            for j in range(label_box_idx + 1, min(label_box_idx + 4, len(boxes))):
                cand_box = boxes[j]
                if _is_system_or_label(cand_box.text):
                    break
                if not _clean_val(cand_box.text):
                    continue
                if _assign_field_value(fields, key, cand_box.text, cand_box.confidence):
                    resolved = True
                    break

    return fields


