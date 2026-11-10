import pytest
from app.services.ktp_parser import validate_nik, cross_validate_ktp
from app.schemas.ocr import KTPFieldExtraction, KTPProcessResult, KTPValidationResult


def test_valid_male_nik():
    # 320405 120590 0001: Prov 32, Kab 04, Kec 05, Male, born 12 May 1990
    result = validate_nik("3204051205900001")
    assert result.is_valid is True
    assert result.province_code == "32"
    assert result.regency_code == "04"
    assert result.district_code == "05"
    assert result.gender == "LAKI-LAKI"
    assert result.birth_date_str == "1990-05-12"
    assert result.sequence == "0001"
    assert len(result.findings) == 0


def test_valid_female_nik():
    # Female born 15 August 1985 -> Day is 15 + 40 = 55 -> 550885
    result = validate_nik("3171015508850002")
    assert result.is_valid is True
    assert result.province_code == "31"
    assert result.gender == "PEREMPUAN"
    assert result.birth_date_str == "1985-08-15"
    assert result.sequence == "0002"
    assert len(result.findings) == 0


def test_invalid_nik_length():
    result = validate_nik("32040512059")  # 11 digits
    assert result.is_valid is False
    assert any(f.type == "INVALID_NIK_LENGTH" for f in result.findings)


def test_invalid_nik_date():
    # Month 13 is invalid
    result = validate_nik("3204051213900001")
    assert result.is_valid is False
    assert any(f.type == "INVALID_NIK_DATE" for f in result.findings)


def test_cross_validate_ktp_mismatch():
    fields = KTPFieldExtraction(
        nik="3204051205900001",
        nama="BUDI SANTOSO",
        tempat_lahir="BANDUNG",
        tgl_lahir="15-08-1992",  # Mismatches NIK birthdate (1990-05-12)
        jenis_kelamin="PEREMPUAN",  # Mismatches NIK gender (LAKI-LAKI)
        alamat="JL. MERDEKA NO 1",
        rt_rw="001/002",
        kel_desa="SUKAJADI",
        kecamatan="SUKAJADI",
        agama="ISLAM",
        status_perkawinan="BELUM KAWIN",
        pekerjaan="KARYAWAN SWASTA",
        kewarganegaraan="WNI",
        berlaku_hingga="SEUMUR HIDUP",
    )
    tamper_result = cross_validate_ktp(fields)
    assert tamper_result.is_valid is False
    assert tamper_result.tamper_score >= 70
    assert any(f.type == "NIK_BIRTHDATE_MISMATCH" for f in tamper_result.findings)
    assert any(f.type == "NIK_GENDER_MISMATCH" for f in tamper_result.findings)


def test_cross_validate_ktp_birthdate_mismatch_only():
    fields = KTPFieldExtraction(
        nik="3204051205900001",
        nama="BUDI SANTOSO",
        tempat_lahir="BANDUNG",
        tgl_lahir="15-08-1992",  # Mismatches NIK birthdate (1990-05-12)
        jenis_kelamin="LAKI-LAKI",  # Matches NIK gender
    )
    tamper_result = cross_validate_ktp(fields)
    assert tamper_result.is_valid is False
    assert tamper_result.tamper_score >= 70.0
    assert any(f.type == "NIK_BIRTHDATE_MISMATCH" for f in tamper_result.findings)
    assert not any(f.type == "NIK_GENDER_MISMATCH" for f in tamper_result.findings)


def test_cross_validate_ktp_gender_mismatch_only():
    fields = KTPFieldExtraction(
        nik="3204051205900001",
        nama="BUDI SANTOSO",
        tempat_lahir="BANDUNG",
        tgl_lahir="12-05-1990",  # Matches NIK birthdate
        jenis_kelamin="PEREMPUAN",  # Mismatches NIK gender (LAKI-LAKI)
    )
    tamper_result = cross_validate_ktp(fields)
    assert tamper_result.is_valid is False
    assert tamper_result.tamper_score >= 70.0
    assert any(f.type == "NIK_GENDER_MISMATCH" for f in tamper_result.findings)
    assert not any(f.type == "NIK_BIRTHDATE_MISMATCH" for f in tamper_result.findings)


def test_missing_nik():
    result = validate_nik(None)
    assert result.is_valid is False
    assert any(f.type == "MISSING_NIK" for f in result.findings)

    result_empty = validate_nik("")
    assert result_empty.is_valid is False
    assert any(f.type == "MISSING_NIK" for f in result_empty.findings)


def test_invalid_province_code():
    # 99 is not a valid province code
    result = validate_nik("9904051205900001")
    assert result.is_valid is False
    assert any(f.type == "INVALID_PROVINCE_CODE" for f in result.findings)


def test_invalid_sequence_number():
    # 0000 is invalid
    result = validate_nik("3204051205900000")
    assert result.is_valid is False
    assert any(f.type == "INVALID_SEQUENCE_NUMBER" for f in result.findings)


def test_cross_validate_ktp_match():
    fields = KTPFieldExtraction(
        nik="3204051205900001",
        nama="BUDI SANTOSO",
        tempat_lahir="BANDUNG",
        tgl_lahir="12-05-1990",  # Matches NIK birthdate
        jenis_kelamin="LAKI-LAKI",  # Matches NIK gender
    )
    tamper_result = cross_validate_ktp(fields)
    assert tamper_result.is_valid is True
    assert tamper_result.tamper_score == 0.0
    assert not any(f.type in ("NIK_BIRTHDATE_MISMATCH", "NIK_GENDER_MISMATCH") for f in tamper_result.findings)


def test_ktp_process_result_schema():
    fields = KTPFieldExtraction(nik="3204051205900001")
    validation = validate_nik("3204051205900001")
    process_result = KTPProcessResult(
        fields=fields,
        validation=validation,
        quality_score=95.0,
        is_blurred=False,
    )
    assert process_result.quality_score == 95.0
    assert process_result.is_blurred is False
    assert process_result.validation.is_valid is True


def test_formatted_nik_with_delimiters():
    result = validate_nik("32-04-05 120590-0001")
    assert result.is_valid is True
    assert result.province_code == "32"
    assert result.birth_date_str == "1990-05-12"


def test_invalid_calendar_date_feb_30():
    result = validate_nik("3204053002900001")
    assert result.is_valid is False
    assert any(f.type == "INVALID_NIK_DATE" for f in result.findings)


def test_nik_born_in_2000s():
    # Born 12 May 2005
    result = validate_nik("3204051205050001")
    assert result.is_valid is True
    assert result.birth_date_str == "2005-05-12"


def test_cross_validate_ktp_with_invalid_nik():
    fields = KTPFieldExtraction(
        nik="invalid-nik",
        tgl_lahir="12-05-1990",
        jenis_kelamin="LAKI-LAKI",
    )
    tamper_result = cross_validate_ktp(fields)
    assert tamper_result.is_valid is False
    assert tamper_result.tamper_score == 0.0


def test_invalid_regency_code():
    result = validate_nik("3200051205900001")
    assert result.is_valid is False
    assert any(f.type == "INVALID_REGENCY_CODE" for f in result.findings)


def test_invalid_district_code():
    result = validate_nik("3204001205900001")
    assert result.is_valid is False
    assert any(f.type == "INVALID_DISTRICT_CODE" for f in result.findings)


def test_expanded_papua_provinces():
    for prov_code in ["93", "94", "95", "96"]:
        result = validate_nik(f"{prov_code}01011205900001")
        assert result.is_valid is True
        assert result.province_code == prov_code
        assert not any(f.type == "INVALID_PROVINCE_CODE" for f in result.findings)


def test_nik_century_cutoff():
    # Born 2009 -> age 17 in 2026, decoded as 2009
    res_2009 = validate_nik("3204051205090001")
    assert res_2009.is_valid is True
    assert res_2009.birth_date_str == "2009-05-12"

    # Born year short 10 -> in 2026, 10 > 9 (26 - 17), decoded as 1910
    res_1910 = validate_nik("3204051205100001")
    assert res_1910.is_valid is True
    assert res_1910.birth_date_str == "1910-05-12"

