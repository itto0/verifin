import { DocumentVerification, VoiceVerification } from '../types';
import { IcrDocumentSample } from './icrData';
import { defaultSalarySlip } from './salarySlipHelper';

/**
 * Validates an Indonesian 16-digit NIK against the recorded birth date and gender
 * per Dukcapil (Ditjen Kependudukan dan Pencatatan Sipil) algorithmic standards.
 *
 * Structure:
 * Digits 1-2: Province code
 * Digits 3-4: Regency/City code
 * Digits 5-6: District/Kecamatan code
 * Digits 7-12: Date of birth (DDMMYY). For females, DD is offset by +40 (41-71).
 * Digits 13-16: Sequential registration index.
 */
export function validateDukcapilNik(
  nik: string,
  birthDate: string,
  gender: string
): { isValid: boolean; anomalies: string[] } {
  const anomalies: string[] = [];

  const cleanNik = nik.trim();
  if (!/^\d{16}$/.test(cleanNik)) {
    anomalies.push('NIK must be exactly 16 digits numeric');
    return { isValid: false, anomalies };
  }

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  const cleanDate = birthDate.trim();
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(cleanDate)) {
    const parts = cleanDate.split(/[-/.]/);
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(cleanDate)) {
    const parts = cleanDate.split(/[-/.]/);
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  }

  if (day === null || month === null || year === null || isNaN(day) || isNaN(month) || isNaN(year)) {
    anomalies.push(`Birth date format invalid on document: "${birthDate}"`);
    return { isValid: false, anomalies };
  }

  const isFemale = /perempuan|wanita|female/i.test(gender);
  const expectedDay = isFemale ? day + 40 : day;
  const expectedMonth = month;
  const expectedYear = year % 100;

  const nikDay = parseInt(cleanNik.slice(6, 8), 10);
  const nikMonth = parseInt(cleanNik.slice(8, 10), 10);
  const nikYear = parseInt(cleanNik.slice(10, 12), 10);

  const dayMatches = nikDay === expectedDay;
  const monthMatches = nikMonth === expectedMonth;
  const yearMatches = nikYear === expectedYear;

  if (!dayMatches || !monthMatches || !yearMatches) {
    const formattedNikDob = `${String(nikDay).padStart(2, '0')}-${String(nikMonth).padStart(2, '0')}-${String(nikYear).padStart(2, '0')}`;
    anomalies.push(
      `Birth date mismatch: NIK indicates ${formattedNikDob} (${isFemale ? 'Female (+40)' : 'Male'}) but document states ${birthDate}`
    );
  }

  return {
    isValid: anomalies.length === 0,
    anomalies,
  };
}

/**
 * OCR Presets for e-KTP verification demos:
 * - clean: Authentic physical KTP with clean Dukcapil match and low risk score (< 30).
 * - tampered: High-risk altered KTP with mismatched font and NIK date inconsistency (score >= 70).
 * - screen_capture: Moiré pattern detected from photographing an LCD monitor.
 */
export const ocrDemoPresets: Record<string, DocumentVerification> = {
  clean: {
    ktpImageUrl: '/ktp_demo_normal.jpg',
    selfieImageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    slipGajiImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    kkImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
    salarySlip: defaultSalarySlip,
    tamperScore: 8,
    faceMatchScore: 97,
    isScreenCaptureDetected: false,
    isPhysicalCopy: true,
    score: 12,
    tamperFlags: [],
    nikValidation: {
      nik: '3275011408940003',
      isValidStructure: true,
      province: '32 - JAWA BARAT',
      regency: '75 - KOTA BEKASI',
      district: '01 - BEKASI TIMUR',
      birthDate: '14-08-1994',
      gender: 'Laki-laki',
      sequenceNumber: '0003',
      dukcapilMatch: true,
      anomalies: [],
    },
    ocrFields: {
      nik: { label: 'NIK', value: '3275011408940003', confidence: 99, isAnomaly: false },
      nama: { label: 'Nama Lengkap', value: 'RIAN HENDRAWAN', confidence: 98, isAnomaly: false },
      tempatLahir: { label: 'Tempat Lahir', value: 'BEKASI', confidence: 97, isAnomaly: false },
      tglLahir: { label: 'Tgl Lahir', value: '14-08-1994', confidence: 99, isAnomaly: false },
      jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 99, isAnomaly: false },
      alamat: { label: 'Alamat', value: 'JL. MELATI NO. 45 RT 004 RW 002', confidence: 96, isAnomaly: false },
      rtRw: { label: 'RT/RW', value: '004/002', confidence: 95, isAnomaly: false },
      kelDesa: { label: 'Kel/Desa', value: 'DUREN JAYA', confidence: 98, isAnomaly: false },
      kecamatan: { label: 'Kecamatan', value: 'BEKASI TIMUR', confidence: 98, isAnomaly: false },
      agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
      statusPerkawinan: { label: 'Status Perkawinan', value: 'BELUM KAWIN', confidence: 97, isAnomaly: false },
      pekerjaan: { label: 'Pekerjaan', value: 'KARYAWAN SWASTA', confidence: 96, isAnomaly: false },
      kewarganegaraan: { label: 'Kewarganegaraan', value: 'WNI', confidence: 99, isAnomaly: false },
      berlakuHingga: { label: 'Berlaku Hingga', value: 'SEUMUR HIDUP', confidence: 99, isAnomaly: false },
    },
  },
  tampered: {
    ktpImageUrl: '/ktp_demo_tampered.jpg',
    selfieImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    slipGajiImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    kkImageUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=600&auto=format&fit=crop&q=80',
    tamperScore: 88,
    faceMatchScore: 54,
    isScreenCaptureDetected: false,
    isPhysicalCopy: false,
    score: 88,
    tamperFlags: [
      'Font baris NIK tidak identik dengan spesifikasi resmi Percetakan Negara RI / Dukcapil (OCR-B mismatch)',
      'Deteksi artefak garis pembatas foto (pixel boundary mismatch - indikasi pasfoto tempelan)',
      'Inkonsistensi microtext background guilloche pada area nama dan tanggal lahir',
    ],
    nikValidation: {
      nik: '3275031208940003',
      isValidStructure: false,
      province: '32 - JAWA BARAT',
      regency: '75 - KOTA BEKASI',
      district: '03 - BEKASI BARAT',
      birthDate: '12-08-1994',
      gender: 'Laki-laki',
      sequenceNumber: '0003',
      dukcapilMatch: false,
      anomalies: [
        'Kode wilayah 327503 valid, namun tanggal lahir pada NIK (12-08-1994) tidak cocok dengan tanggal lahir di kolom keterangan KTP (tertulis 14-08-1994)',
      ],
    },
    ocrFields: {
      nik: { label: 'NIK', value: '3275031208940003', confidence: 94, isAnomaly: true, anomalyReason: 'Mismatch dengan tanggal lahir fisik KTP' },
      nama: { label: 'Nama Lengkap', value: 'RIAN HENDRAWAN', confidence: 96, isAnomaly: false },
      tempatLahir: { label: 'Tempat Lahir', value: 'BEKASI', confidence: 95, isAnomaly: false },
      tglLahir: { label: 'Tgl Lahir', value: '14-08-1994', confidence: 88, isAnomaly: true, anomalyReason: 'Confidence <90% & inkonsistensi NIK' },
      jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 98, isAnomaly: false },
      alamat: { label: 'Alamat', value: 'JL. MELATI NO. 45 RT 004 RW 002', confidence: 82, isAnomaly: true, anomalyReason: 'Confidence <90% (teks buram pada angka RT/RW)' },
      rtRw: { label: 'RT/RW', value: '004/002', confidence: 84, isAnomaly: true, anomalyReason: 'Indikasi penimpaan angka RT' },
      kelDesa: { label: 'Kel/Desa', value: 'KRANJI', confidence: 93, isAnomaly: false },
      kecamatan: { label: 'Kecamatan', value: 'BEKASI BARAT', confidence: 95, isAnomaly: false },
      agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
      statusPerkawinan: { label: 'Status Perkawinan', value: 'BELUM KAWIN', confidence: 94, isAnomaly: false },
      pekerjaan: { label: 'Pekerjaan', value: 'KARYAWAN SWASTA', confidence: 91, isAnomaly: false },
      kewarganegaraan: { label: 'Kewarganegaraan', value: 'WNI', confidence: 99, isAnomaly: false },
      berlakuHingga: { label: 'Berlaku Hingga', value: 'SEUMUR HIDUP', confidence: 98, isAnomaly: false },
    },
  },
  screen_capture: {
    ktpImageUrl: '/ktp_demo_tampered.jpg',
    selfieImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    slipGajiImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    tamperScore: 78,
    faceMatchScore: 68,
    isScreenCaptureDetected: true,
    isPhysicalCopy: false,
    score: 74,
    tamperFlags: [
      'Pola moiré interferensi terdeteksi: foto diambil langsung dari layar monitor / LCD',
      'Refleksi specular highlight khas permukaan kaca layar perangkat elektronik',
      'Pixel grid sub-pixel RGB terdeteksi pada analisis frekuensi Fourier 2D',
    ],
    nikValidation: {
      nik: '3275011408940003',
      isValidStructure: true,
      province: '32 - JAWA BARAT',
      regency: '75 - KOTA BEKASI',
      district: '01 - BEKASI TIMUR',
      birthDate: '14-08-1994',
      gender: 'Laki-laki',
      sequenceNumber: '0003',
      dukcapilMatch: true,
      anomalies: [
        'Peringatan keaslian fisik: Dokumen dipotret ulang dari monitor (bukan e-KTP fisik asli)',
      ],
    },
    ocrFields: {
      nik: { label: 'NIK', value: '3275011408940003', confidence: 89, isAnomaly: true, anomalyReason: 'Artefak moiré menurunkan ketajaman karakter' },
      nama: { label: 'Nama Lengkap', value: 'RIAN HENDRAWAN', confidence: 92, isAnomaly: false },
      tempatLahir: { label: 'Tempat Lahir', value: 'BEKASI', confidence: 91, isAnomaly: false },
      tglLahir: { label: 'Tgl Lahir', value: '14-08-1994', confidence: 90, isAnomaly: false },
      jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 94, isAnomaly: false },
      alamat: { label: 'Alamat', value: 'JL. MELATI NO. 45 RT 004 RW 002', confidence: 85, isAnomaly: true, anomalyReason: 'Refleksi layar mengaburkan teks' },
      rtRw: { label: 'RT/RW', value: '004/002', confidence: 87, isAnomaly: false },
      kelDesa: { label: 'Kel/Desa', value: 'DUREN JAYA', confidence: 91, isAnomaly: false },
      kecamatan: { label: 'Kecamatan', value: 'BEKASI TIMUR', confidence: 92, isAnomaly: false },
      agama: { label: 'Agama', value: 'ISLAM', confidence: 97, isAnomaly: false },
      statusPerkawinan: { label: 'Status Perkawinan', value: 'BELUM KAWIN', confidence: 93, isAnomaly: false },
      pekerjaan: { label: 'Pekerjaan', value: 'KARYAWAN SWASTA', confidence: 88, isAnomaly: false },
      kewarganegaraan: { label: 'Kewarganegaraan', value: 'WNI', confidence: 98, isAnomaly: false },
      berlakuHingga: { label: 'Berlaku Hingga', value: 'SEUMUR HIDUP', confidence: 95, isAnomaly: false },
    },
  },
};

export const casePresets = ocrDemoPresets;

/**
 * ICR Presets for surveyor handwriting and BPN Sentuh Tanahku collateral verification:
 * - survey_clean: Verified surveyor field inspection form with clean legible handwriting.
 * - clean_shm: Valid SHM certificate matching ATR/BPN land registry and surveyed geolocation.
 * - cadastral_mismatch: BPN spatial mismatch flag (coordinates differ from surveyed property).
 * - low_confidence: Hand-written survey form with blurry handwriting and illegible numbers.
 */
export const icrDemoPresets: Record<string, IcrDocumentSample> = {
  survey_clean: {
    id: 'ICR-PRESET-CLEAN-SURVEY',
    type: 'survey_form',
    title: 'Formulir Survei Lapangan BAF (Survei Terverifikasi)',
    applicantName: 'Budi Santoso',
    caseId: 'CASE-001',
    scanDate: '2026-10-27 10:15 WIB',
    documentNumber: 'SRV-FORM-2026-001',
    overallConfidence: 96,
    status: 'verified',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    summaryNote: 'Formulir survei lapangan CMO terverifikasi bersih. Seluruh isian tulisan tangan jelas, daya listrik 1300 VA cocok dengan foto meteran, dan catatan lingkungan RT/RW mengonfirmasi domisili tetap.',
    extractedFields: [
      {
        fieldKey: 'status_kepemilikan',
        label: 'Status Tempat Tinggal',
        extractedValue: 'Milik Sendiri (Keluarga)',
        normalizedValue: 'MILIK_SENDIRI',
        confidence: 98,
        isAnomaly: false,
      },
      {
        fieldKey: 'daya_listrik',
        label: 'Kapasitas Listrik (PLN)',
        extractedValue: '1300 VA (Pascabayar)',
        normalizedValue: '1300_VA',
        confidence: 95,
        isAnomaly: false,
      },
      {
        fieldKey: 'lama_tinggal',
        label: 'Lama Menempati Domisili',
        extractedValue: '5 Tahun',
        normalizedValue: '60_BULAN',
        confidence: 96,
        isAnomaly: false,
      },
      {
        fieldKey: 'nama_penjamin',
        label: 'Nama Penjamin / Pasangan',
        extractedValue: 'SITI AMINAH (Istri)',
        normalizedValue: 'SITI AMINAH',
        confidence: 97,
        isAnomaly: false,
      },
      {
        fieldKey: 'penghasilan_tambahan',
        label: 'Est. Penghasilan Tambahan / Usaha',
        extractedValue: 'Rp 3.500.000 (Warung Kelontong)',
        normalizedValue: '3500000',
        confidence: 94,
        isAnomaly: false,
      },
      {
        fieldKey: 'catatan_lingkungan',
        label: 'Catatan Karakter Lingkungan RT/RW',
        extractedValue: 'Dikonfirmasi Ketua RT 05 dan tetangga, pemohon berkepribadian baik dan tinggal tetap.',
        normalizedValue: 'VALID_RT',
        confidence: 97,
        isAnomaly: false,
      },
    ],
  },
  clean_shm: {
    id: 'ICR-PRESET-CLEAN',
    type: 'bpn_certificate',
    title: 'Sertipikat Hak Milik (SHM) Agunan Tambahan / Sentuh Tanahku',
    applicantName: 'Bagus Prasetyo',
    caseId: 'CASE-0943',
    scanDate: '2026-10-27 10:50 WIB',
    documentNumber: 'SHM-3174-05-01294',
    overallConfidence: 96,
    status: 'verified',
    thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    summaryNote: 'Validasi OCR dan pencocokan koordinat persil bidang tanah Sentuh Tanahku (Kementerian ATR/BPN) terverifikasi cocok.',
    extractedFields: [
      {
        fieldKey: 'shm_nomor',
        label: 'Nomor Sertipikat',
        extractedValue: 'SHM No. 01294/Kebon Jeruk',
        normalizedValue: 'SHM-01294',
        confidence: 99,
        isAnomaly: false,
      },
      {
        fieldKey: 'nib',
        label: 'Nomor Identifikasi Bidang (NIB)',
        extractedValue: '09.02.04.05.01294',
        normalizedValue: '09.02.04.05.01294',
        confidence: 98,
        isAnomaly: false,
      },
      {
        fieldKey: 'luas_tanah',
        label: 'Luas Tanah Terdaftar',
        extractedValue: '142 m2 (Seratus Empat Puluh Dua Meter Persegi)',
        normalizedValue: '142',
        confidence: 97,
        isAnomaly: false,
      },
      {
        fieldKey: 'nama_pemilik',
        label: 'Nama Pemegang Hak',
        extractedValue: 'BAGUS PRASETYO',
        normalizedValue: 'BAGUS PRASETYO',
        confidence: 99,
        isAnomaly: false,
      },
      {
        fieldKey: 'asal_hak',
        label: 'Asal Hak Milik',
        extractedValue: 'Konversi Letter C No. 402/Dsk',
        normalizedValue: 'KONVERSI_C',
        confidence: 94,
        isAnomaly: false,
      },
    ],
    bpnSpatialVerification: {
      persilNib: '09.02.04.05.01294',
      shmNumber: 'SHM No. 01294/Kebon Jeruk',
      surfaceAreaM2: 142,
      districtOffice: 'Kantor Pertanahan Kota Administrasi Jakarta Barat',
      registeredOwner: 'BAGUS PRASETYO',
      applicantRelation: 'Pemohon Langsung (Sesuai KTP)',
      latitude: -6.19234,
      longitude: 106.77123,
      spatialMatchWithSurveyAddress: true,
      sentuhTanahkuStatus: 'Terverifikasi BPN',
    },
  },
  cadastral_mismatch: {
    id: 'ICR-PRESET-MISMATCH',
    type: 'bpn_certificate',
    title: 'Sertipikat Hak Milik (SHM) - Anomali Kadastral BPN',
    applicantName: 'Hendra Gunawan',
    caseId: 'CASE-0945',
    scanDate: '2026-10-27 15:20 WIB',
    documentNumber: 'SHM-3275-01-08812',
    overallConfidence: 82,
    status: 'mismatch_flag',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    summaryNote: 'Koordinat plot persil Sentuh Tanahku berjarak 3.8 km dari alamat survei faktual pemohon. Nama pemilik terdaftar pada sertipikat berbeda dengan pemohon.',
    extractedFields: [
      {
        fieldKey: 'shm_nomor',
        label: 'Nomor Sertipikat',
        extractedValue: 'SHM No. 08812/Bekasi Jaya',
        normalizedValue: 'SHM-08812',
        confidence: 96,
        isAnomaly: false,
      },
      {
        fieldKey: 'nib',
        label: 'Nomor Identifikasi Bidang (NIB)',
        extractedValue: '32.75.01.02.08812',
        normalizedValue: '32.75.01.02.08812',
        confidence: 94,
        isAnomaly: false,
      },
      {
        fieldKey: 'luas_tanah',
        label: 'Luas Tanah Terdaftar',
        extractedValue: '90 m2 (Sembilan Puluh Meter Persegi)',
        normalizedValue: '90',
        confidence: 92,
        isAnomaly: false,
      },
      {
        fieldKey: 'nama_pemilik',
        label: 'Nama Pemegang Hak',
        extractedValue: 'SLAMET RIYADI',
        normalizedValue: 'SLAMET RIYADI',
        confidence: 98,
        isAnomaly: true,
        anomalyNote: 'Nama pemilik pada SHM adalah SLAMET RIYADI, bukan nama pemohon (HENDRA GUNAWAN)',
      },
      {
        fieldKey: 'letak_tanah',
        label: 'Letak Tanah / Persil',
        extractedValue: 'Kelurahan Bekasi Jaya, Kecamatan Bekasi Timur',
        normalizedValue: 'BEKASI_JAYA',
        confidence: 89,
        isAnomaly: true,
        anomalyNote: 'Lokasi persil tidak berada di alamat domisili survei pemohon',
      },
    ],
    bpnSpatialVerification: {
      persilNib: '32.75.01.02.08812',
      shmNumber: 'SHM No. 08812/Bekasi Jaya',
      surfaceAreaM2: 90,
      districtOffice: 'Kantor Pertanahan Kota Bekasi',
      registeredOwner: 'SLAMET RIYADI',
      applicantRelation: 'Bukan Pemilik / Pihak Ketiga (Tanpa Surat Kuasa)',
      latitude: -6.23412,
      longitude: 107.01245,
      spatialMatchWithSurveyAddress: false,
      sentuhTanahkuStatus: 'Beda Nama Pemilik',
    },
  },
  low_confidence: {
    id: 'ICR-PRESET-LOWCONF',
    type: 'survey_form',
    title: 'Formulir Survei Lapangan BAF (Tulisan Tangan CMO)',
    applicantName: 'Rian Hendrawan',
    caseId: 'CASE-0941',
    scanDate: '2026-10-27 11:35 WIB',
    documentNumber: 'SRV-FORM-2026-0941',
    overallConfidence: 62,
    status: 'needs_review',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    summaryNote: 'Terdapat 3 isian tulisan tangan yang terindikasi anomali pada bagian daya listrik, penghasilan, dan status sewa rumah.',
    extractedFields: [
      {
        fieldKey: 'status_kepemilikan',
        label: 'Status Tempat Tinggal',
        extractedValue: 'Kontrak / Sewa Bulanan',
        normalizedValue: 'SEWA',
        confidence: 68,
        isAnomaly: true,
        anomalyNote: 'Tulisan buram pada kata sewa, perlu konfirmasi kuitansi sewa',
      },
      {
        fieldKey: 'daya_listrik',
        label: 'Kapasitas Listrik (PLN)',
        extractedValue: '900 VA (Token)',
        normalizedValue: '900_VA',
        confidence: 64,
        isAnomaly: true,
        anomalyNote: 'Tulisan angka 9 agak terpotong menyerupai 4, perlu konfirmasi dengan foto meteran',
      },
      {
        fieldKey: 'lama_tinggal',
        label: 'Lama Menempati Domisili',
        extractedValue: '1 Tahun 4 Bulan',
        normalizedValue: '16_BULAN',
        confidence: 78,
        isAnomaly: false,
      },
      {
        fieldKey: 'penghasilan_tambahan',
        label: 'Est. Penghasilan Tambahan / Usaha',
        extractedValue: 'Rp 2.500.000',
        normalizedValue: '2500000',
        confidence: 58,
        isAnomaly: true,
        anomalyNote: 'Angka nol terakhir coret tipbal, perlu verifikasi verifikator',
      },
      {
        fieldKey: 'catatan_lingkungan',
        label: 'Catatan Karakter Lingkungan RT/RW',
        extractedValue: 'Dikonfirmasi ketua RT 04 konsumen aktif berdomisili.',
        normalizedValue: 'VALID_RT',
        confidence: 72,
        isAnomaly: false,
      },
    ],
  },
};

/**
 * Voice STT & Compliance Presets:
 * - nominal: Compliant call, high compliance score (>= 90), zero hesitancy flags.
 * - hesitant_noncompliant: Low compliance score (< 80), lengthy pauses (> 3s), missed mandatory disclosures.
 * - coaching_suspicion: Moderate compliance but background whispering/coaching cues detected.
 */
export const voiceDemoPresets: Record<string, VoiceVerification> = {
  nominal: {
    callId: 'CALL-PRESET-NOMINAL',
    callDuration: 185,
    agentName: 'Fitri Handayani',
    agentId: 'AGT-044',
    callTimestamp: '2026-10-27 10:15:00',
    audioDurationFormatted: '03:05',
    overallHesitancyCount: 0,
    spellingAccuracyScore: 98,
    scriptComplianceScore: 96,
    score: 12,
    voiceFlags: [],
    complianceChecklist: [
      { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri verifikator', isCompliant: true, timestampRef: 3 },
      { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon', isCompliant: true, timestampRef: 24 },
      { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung nasabah', isCompliant: true, timestampRef: 48 },
      { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit kendaraan & tenor pembiayaan', isCompliant: true, timestampRef: 82 },
      { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 118 },
      { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK', isCompliant: true, timestampRef: 165 },
    ],
    transcripts: [
      { id: 'T-1', speaker: 'agent', startTime: 0, endTime: 5, text: 'Selamat pagi, saya Fitri dari Verifikasi Pembiayaan BAF. Benar dengan Bapak Bagus Prasetyo?' },
      { id: 'T-2', speaker: 'customer', startTime: 6, endTime: 9, text: 'Selamat pagi Mbak Fitri. Betul saya sendiri.' },
      { id: 'T-3', speaker: 'agent', startTime: 10, endTime: 18, text: 'Mohon izin konfirmasi data pengajuan pembiayaan unit motor Yamaha ya Pak Bagus.' },
      { id: 'T-4', speaker: 'customer', startTime: 19, endTime: 21, text: 'Baik Mbak, silakan.' },
      { id: 'T-5', speaker: 'agent', startTime: 22, endTime: 29, text: 'Bisa dibantu sebutkan kembali nomor NIK KTP Bapak?' },
      { id: 'T-6', speaker: 'customer', startTime: 30, endTime: 42, text: 'Tiga satu tujuh empat nol lima nol satu nol delapan sembilan empat nol nol nol satu.', spellingMatch: true },
      { id: 'T-7', speaker: 'agent', startTime: 43, endTime: 48, text: 'Cocok Pak. Untuk nama gadis ibu kandung siapa ya Pak?' },
      { id: 'T-8', speaker: 'customer', startTime: 49, endTime: 53, text: 'Ibu Siti Aminah.' },
      { id: 'T-9', speaker: 'agent', startTime: 54, endTime: 66, text: 'Baik Pak Bagus. Terima kasih, seluruh data telah terverifikasi dengan sesuai dan tercatat di sistem BAF.' },
    ],
  },
  hesitant_noncompliant: {
    callId: 'CALL-PRESET-HESITANT',
    callDuration: 245,
    agentName: 'Fitri Handayani',
    agentId: 'AGT-044',
    callTimestamp: '2026-10-27 13:40:11',
    audioDurationFormatted: '04:05',
    overallHesitancyCount: 3,
    spellingAccuracyScore: 68,
    scriptComplianceScore: 65,
    score: 72,
    voiceFlags: [
      'Jeda keraguan 3.4 detik saat pertanyaan keamanan nama gadis ibu kandung',
      'Jeda 2.8 detik saat konfirmasi tanggal lahir nasabah',
      'Salah sebut nominal cicilan pertama (menyebutkan Rp 1.100.000, seharusnya Rp 1.395.000)',
      'Pernyataan klausul persetujuan OJK tidak dibacakan lengkap sebelum panggilan berakhir',
    ],
    complianceChecklist: [
      { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri verifikator', isCompliant: true, timestampRef: 4 },
      { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon', isCompliant: true, timestampRef: 28 },
      { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung nasabah', isCompliant: false, timestampRef: 54, note: 'Konsumen ragu 3.4 detik & salah sebut awal' },
      { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit Yamaha NMAX 155 & tenor 35 bulan', isCompliant: true, timestampRef: 92 },
      { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: false, timestampRef: 140, note: 'Konsumen salah sebut angka cicilan' },
      { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK', isCompliant: false, timestampRef: 230, note: 'Panggilan terputus sebelum pembacaan lengkap klausul OJK' },
    ],
    transcripts: [
      { id: 'T-1', speaker: 'agent', startTime: 0, endTime: 6, text: 'Selamat siang, saya Fitri dari Verifikasi Pembiayaan BAF. Benar saya terhubung dengan Bapak Rian Hendrawan?' },
      { id: 'T-2', speaker: 'customer', startTime: 7, endTime: 11, text: 'Iya selamat siang Mbak. Betul saya sendiri, Pak Rian.' },
      { id: 'T-3', speaker: 'agent', startTime: 12, endTime: 22, text: 'Terima kasih Pak Rian. Mohon izin melakukan verifikasi data singkat terkait pengajuan pembiayaan unit Yamaha NMAX ya Pak.' },
      { id: 'T-4', speaker: 'customer', startTime: 23, endTime: 26, text: 'Iya silakan Mbak.' },
      { id: 'T-5', speaker: 'agent', startTime: 27, endTime: 34, text: 'Bisa dibantu sebutkan kembali 16 digit Nomor Induk Kependudukan (NIK) KTP Bapak?' },
      { id: 'T-6', speaker: 'customer', startTime: 35, endTime: 48, text: 'Tiga dua tujuh lima nol tiga satu dua nol delapan sembilan empat nol nol nol tiga.', spellingMatch: true },
      { id: 'T-7', speaker: 'agent', startTime: 49, endTime: 54, text: 'Baik cocok Pak. Untuk nama gadis ibu kandung siapa ya Pak?' },
      { id: 'T-8', speaker: 'customer', startTime: 55, endTime: 65, text: 'Eee... tunggu sebentar Mbak... eee... Nurhasanah.', hasHesitancy: true, hesitancyDuration: 3.4, pitchTremor: true, flagReason: 'Jeda panjang 3.4 detik & intonasi bergetar sebelum menjawab nama ibu' },
      { id: 'T-9', speaker: 'agent', startTime: 66, endTime: 75, text: 'Baik, Ibu Nurhasanah. Lalu untuk tanggal lahir Bapak sendiri tanggal berapa ya?' },
      { id: 'T-10', speaker: 'customer', startTime: 76, endTime: 85, text: 'Eee... empat belas Agustus sembilan puluh empat.', hasHesitancy: true, hesitancyDuration: 2.8, flagReason: 'Jeda 2.8 detik; tanggal lahir di KTP tertulis 14 Agustus tetapi NIK 12 Agustus' },
      { id: 'T-11', speaker: 'agent', startTime: 86, endTime: 100, text: 'Untuk unit Yamaha All New NMAX 155 dengan tenor 35 bulan. Berapa nominal angsuran per bulannya Pak?' },
      { id: 'T-12', speaker: 'customer', startTime: 101, endTime: 114, text: 'Sekitar satu juta seratus ribu ya Mbak?', hasHesitancy: true, hesitancyDuration: 1.8, flagReason: 'Salah sebut nominal angsuran (seharusnya Rp 1.395.000)' },
      { id: 'T-13', speaker: 'agent', startTime: 115, endTime: 130, text: 'Sesuai kesepakatan aplikasi angsurannya Rp 1.395.000 ya Pak. Apakah Bapak menyetujui nominal tersebut?' },
      { id: 'T-14', speaker: 'customer', startTime: 131, endTime: 138, text: 'Oh iya iya betul Mbak, Rp 1.395.000.' },
    ],
  },
  coaching_suspicion: {
    callId: 'CALL-PRESET-COACHING',
    callDuration: 210,
    agentName: 'Ahmad Fauzi',
    agentId: 'AGT-019',
    callTimestamp: '2026-10-27 16:05:30',
    audioDurationFormatted: '03:30',
    overallHesitancyCount: 2,
    spellingAccuracyScore: 74,
    scriptComplianceScore: 82,
    score: 82,
    voiceFlags: [
      'Bisikan suara pihak ketiga terdeteksi di latar belakang sebelum jawaban nama ibu kandung',
      'Jeda 2.5 detik sinkron dengan audio bisikan latar (indikasi coaching / diarahkan orang lain)',
      'Konsumen mengulang kata per kata yang dibisikkan pihak luar',
    ],
    complianceChecklist: [
      { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri verifikator', isCompliant: true, timestampRef: 3 },
      { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon', isCompliant: true, timestampRef: 20 },
      { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung nasabah', isCompliant: false, timestampRef: 45, note: 'Terdengar bisikan pihak ketiga memberi tahu nama ibu' },
      { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit Yamaha Aerox 155 & tenor 24 bulan', isCompliant: true, timestampRef: 75 },
      { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 110 },
      { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK', isCompliant: true, timestampRef: 155 },
    ],
    transcripts: [
      { id: 'T-1', speaker: 'agent', startTime: 0, endTime: 6, text: 'Selamat sore, saya Ahmad dari Verifikasi BAF. Bisa berbicara dengan Saudara Hendra?' },
      { id: 'T-2', speaker: 'customer', startTime: 7, endTime: 10, text: 'Iya sore Mas. Saya Hendra.' },
      { id: 'T-3', speaker: 'agent', startTime: 11, endTime: 18, text: 'Bisa disebutkan nomor NIK e-KTP Anda untuk verifikasi data?' },
      { id: 'T-4', speaker: 'customer', startTime: 19, endTime: 32, text: 'Tiga dua tujuh lima nol satu dua nol satu satu sembilan nol nol nol satu.', spellingMatch: true },
      { id: 'T-5', speaker: 'agent', startTime: 33, endTime: 38, text: 'Baik. Siapa nama gadis ibu kandung Anda?' },
      { id: 'T-6', speaker: 'customer', startTime: 39, endTime: 49, text: '... (terdengar bisikan: "Siti... Siti Aminah") ... Nama ibu saya Siti Aminah Mas.', hasHesitancy: true, hesitancyDuration: 2.5, flagReason: 'Audio bisikan pihak ketiga terdengar sebelum konsumen menjawab' },
      { id: 'T-7', speaker: 'agent', startTime: 50, endTime: 58, text: 'Apakah Anda saat ini sedang bersama orang lain atau didampingi perantara dealer?' },
      { id: 'T-8', speaker: 'customer', startTime: 59, endTime: 65, text: 'Eee enggak Mas, saya sendirian di rumah.', hasHesitancy: true, hesitancyDuration: 1.5, pitchTremor: true, flagReason: 'Penyangkalan ragu setelah indikasi coaching' },
    ],
  },
};
