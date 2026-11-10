from datetime import datetime
import re
from typing import Any, List, Optional, Tuple
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


def extract_ktp_fields_from_ocr(lines: List[Any]) -> KTPFieldExtraction:
    """Parses sequential OCR lines using regex rules for Indonesian e-KTP layout."""
    fields = KTPFieldExtraction()

    for line in lines:
        if hasattr(line, "text"):
            txt = str(line.text).strip()
            conf = float(getattr(line, "confidence", 1.0))
        elif isinstance(line, (list, tuple)) and len(line) >= 2:
            txt = str(line[0]).strip()
            conf = float(line[1])
        else:
            txt = str(line).strip()
            conf = 1.0

        # NIK detection
        nik_match = re.search(r"\b(\d{16})\b", txt)
        if not nik_match:
            # Check for NIK : 3204...
            nik_match = re.search(r"NIK\s*[:;.]?\s*([0-9Xx\s]{16,20})", txt, re.IGNORECASE)
            if nik_match:
                cleaned = re.sub(r"\D", "", nik_match.group(1))
                if len(cleaned) == 16 and not fields.nik:
                    fields.nik = cleaned
                    fields.field_confidences["nik"] = conf
        else:
            if not fields.nik:
                fields.nik = nik_match.group(1)
                fields.field_confidences["nik"] = conf

        # Nama
        nama_match = re.search(r"Nama\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if nama_match and not fields.nama:
            fields.nama = nama_match.group(1).strip()
            fields.field_confidences["nama"] = conf

        # Tempat / Tgl Lahir
        ttl_match = re.search(r"Tempat.*Lahir\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if ttl_match and not fields.tgl_lahir:
            ttl_val = ttl_match.group(1).strip()
            if "," in ttl_val:
                parts = ttl_val.split(",", 1)
                fields.tempat_lahir = parts[0].strip()
                fields.tgl_lahir = parts[1].strip()
            else:
                fields.tgl_lahir = ttl_val
            fields.field_confidences["tgl_lahir"] = conf
            if fields.tempat_lahir:
                fields.field_confidences["tempat_lahir"] = conf

        # Jenis Kelamin
        jk_match = re.search(r"Jenis\s*Kelamin\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if jk_match and not fields.jenis_kelamin:
            val = jk_match.group(1).strip()
            if "LAKI" in val.upper():
                fields.jenis_kelamin = "LAKI-LAKI"
            elif "PEREMPUAN" in val.upper():
                fields.jenis_kelamin = "PEREMPUAN"
            else:
                fields.jenis_kelamin = val
            fields.field_confidences["jenis_kelamin"] = conf

        # Alamat
        alamat_match = re.search(r"Alamat\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if alamat_match and not fields.alamat:
            fields.alamat = alamat_match.group(1).strip()
            fields.field_confidences["alamat"] = conf

        # RT/RW
        rtrw_match = re.search(r"RT\s*/\s*RW\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if rtrw_match and not fields.rt_rw:
            fields.rt_rw = rtrw_match.group(1).strip()
            fields.field_confidences["rt_rw"] = conf

        # Kel/Desa
        kel_match = re.search(r"Kel\s*/\s*Desa\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if kel_match and not fields.kel_desa:
            fields.kel_desa = kel_match.group(1).strip()
            fields.field_confidences["kel_desa"] = conf

        # Kecamatan
        kec_match = re.search(r"Kecamatan\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if kec_match and not fields.kecamatan:
            fields.kecamatan = kec_match.group(1).strip()
            fields.field_confidences["kecamatan"] = conf

        # Agama
        agama_match = re.search(r"Agama\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if agama_match and not fields.agama:
            fields.agama = agama_match.group(1).strip()
            fields.field_confidences["agama"] = conf

        # Status Perkawinan
        kawin_match = re.search(r"Status\s*Perkawinan\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if kawin_match and not fields.status_perkawinan:
            fields.status_perkawinan = kawin_match.group(1).strip()
            fields.field_confidences["status_perkawinan"] = conf

        # Pekerjaan
        kerja_match = re.search(r"Pekerjaan\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if kerja_match and not fields.pekerjaan:
            fields.pekerjaan = kerja_match.group(1).strip()
            fields.field_confidences["pekerjaan"] = conf

        # Kewarganegaraan
        wn_match = re.search(r"Kewarganegaraan\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if wn_match and not fields.kewarganegaraan:
            fields.kewarganegaraan = wn_match.group(1).strip()
            fields.field_confidences["kewarganegaraan"] = conf

        # Berlaku Hingga
        berlaku_match = re.search(r"Berlaku\s*Hingga\s*[:;.]?\s*(.+)$", txt, re.IGNORECASE)
        if berlaku_match and not fields.berlaku_hingga:
            fields.berlaku_hingga = berlaku_match.group(1).strip()
            fields.field_confidences["berlaku_hingga"] = conf

    return fields
