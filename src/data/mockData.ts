import { FinancingCase, RiskEngineRules, SurveyorPoint, AuthUser } from '../types';
import { defaultSalarySlip } from './salarySlipHelper';
import { case0941CleanVoiceVerification } from './prompts/elevenlabsCallPrompts';

export const DEMO_USERS: AuthUser[] = [
  {
    id: 'USR-001',
    name: 'Dian Pratama',
    email: 'dian.pratama@baf.id',
    role: 'Senior Verifier',
    level: 'Level 2 Verifier',
    branch: 'BAF Jakarta Selatan',
    avatarInitials: 'DP',
    employeeNik: 'BAF-EMP-8842'
  },
  {
    id: 'USR-002',
    name: 'Budi Santoso',
    email: 'budi.santoso@baf.id',
    role: 'Risk Lead & Fraud Specialist',
    level: 'Supervisory Lead',
    branch: 'Head Office (Risk Engine)',
    avatarInitials: 'BS',
    employeeNik: 'BAF-EMP-4019'
  },
  {
    id: 'USR-003',
    name: 'Rina Anggraini',
    email: 'rina.anggraini@baf.id',
    role: 'Branch Verification Officer',
    level: 'Level 1 Underwriter',
    branch: 'BAF Kota Bekasi',
    avatarInitials: 'RA',
    employeeNik: 'BAF-EMP-9174'
  }
];

export const initialRules: RiskEngineRules = {
 weightEktp: 30,
 weightLocation: 30,
 weightVoice: 25,
 weightDocument: 15,
 greenRadiusMeters: 200,
 yellowRadiusMeters: 1000,
 ocrConfidenceThreshold: 90,
 hesitancyThresholdSeconds: 2.0,
 autoApproveMaxScore: 39,
 autoRejectMinScore: 70,
};

export const mockCases: FinancingCase[] = [
 {
 id: 'CASE-0941',
 applicationNumber: 'BAF-APP-2026-0941',
 submittedAt: '2026-10-27 14:15:20',
 customerName: 'Ahmad Fauzi',
 customerNik: '3174012005850001',
 customerPhone: '0812-8891-3490',
 branch: 'BAF Jakarta Selatan',
 vehicleModel: 'Yamaha NMAX 155 Connected',
 downPayment: 5500000,
 loanAmount: 31200000,
 tenorMonths: 35,
 monthlyInstallment: 1395000,
 status: 'pending',
 riskScore: {
 totalScore: 15,
 level: 'low',
 recommendation: 'Lolos Otomatis: Verifikasi bersih tanpa anomali, titik survei akurat (32m), dan e-KTP valid.',
 pillars: {
 ektp: { score: 12, weight: 30, weightedScore: 3.6 },
 location: { score: 10, weight: 30, weightedScore: 3.0 },
 voice: { score: 18, weight: 25, weightedScore: 4.5 },
 document: { score: 26, weight: 15, weightedScore: 3.9 },
 },
 reasons: [
 'Titik survei akurat 32 meter dari alamat KTP (zona hijau ≤200 m)',
 'Struktur NIK valid dan terverifikasi Dukcapil tanpa anomali',
 'Fisik e-KTP asli tanpa indikasi manipulasi atau screen capture',
 'Foto fisik rumah dan meteran listrik KWH terverifikasi in-app camera',
 'Tele-verifikasi lancar 100% kepatuhan script tanpa jeda keraguan'
 ]
 },
 document: {
 ktpImageUrl: '/ktp_demo_normal.jfif',
 selfieImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
 slipGajiImageUrl: '/slip_gaji_normal.jfif',
 kkImageUrl: '/kartu_keluarga_normal.jfif',
 salarySlip: {
  ...defaultSalarySlip,
  employeeName: 'AHMAD FAUZI',
  employeeNik: '3174012005850001',
  monthlyInstallment: 1395000,
  dsrPercentage: 20.36,
  isDsrHealthy: true,
  slipImageUrl: '/slip_gaji_normal.jfif',
 },
 tamperScore: 12,
 faceMatchScore: 96,
 isScreenCaptureDetected: false,
 isPhysicalCopy: true,
 score: 12,
 tamperFlags: [],
 nikValidation: {
 nik: '3174012005850001',
 isValidStructure: true,
 province: '31 - DKI JAKARTA',
 regency: '74 - JAKARTA SELATAN',
 district: '01 - TEBET',
 birthDate: '20-05-1985',
 gender: 'Laki-laki',
 sequenceNumber: '0001',
 dukcapilMatch: true,
 anomalies: []
 },
 ocrFields: {
 nik: { label: 'NIK', value: '3174012005850001', confidence: 94, isAnomaly: false },
 nama: { label: 'Nama Lengkap', value: 'AHMAD FAUZI', confidence: 96, isAnomaly: false },
 tempatLahir: { label: 'Tempat Lahir', value: 'JAKARTA', confidence: 95, isAnomaly: false },
 tglLahir: { label: 'Tgl Lahir', value: '20-05-1985', confidence: 88, isAnomaly: false },
 jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 98, isAnomaly: false },
 alamat: { label: 'Alamat', value: 'JL. TEBET BARAT DALAM NO. 12 RT 005 RW 002', confidence: 82, isAnomaly: false },
 kelDesa: { label: 'Kel/Desa', value: 'TEBET BARAT', confidence: 93, isAnomaly: false },
 kecamatan: { label: 'Kecamatan', value: 'TEBET', confidence: 95, isAnomaly: false },
 agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
 pekerjaan: { label: 'Pekerjaan', value: 'KARYAWAN SWASTA', confidence: 91, isAnomaly: false }
 }
 },
 geo: {
 surveyorName: 'Bambang Sudirgo',
 surveyorId: 'SRV-JKT-104',
 surveyTimestamp: '2026-10-27 11:32:04',
 targetAddress: 'Jl. Tebet Barat Dalam No. 12 RT 005 RW 002, Tebet Barat, Tebet, Jakarta Selatan',
 targetLat: -6.2383,
 targetLng: 106.8532,
 surveyLat: -6.2385,
 surveyLng: 106.8534,
 distanceMeters: 32,
 distanceStatus: 'green',
 isMockLocationDetected: false,
 score: 10,
 surveyPhotos: [
 {
 id: 'PHT-01',
 caption: 'Tampak Depan Rumah (Nomor Rumah Jelas)',
 timestamp: '2026-03-28 10:14:32',
 lat: -6.229728,
 lng: 106.845612,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'house_front',
 imageUrl: '/survey_house_front.jfif',
 },
 {
 id: 'PHT-02',
 caption: 'Meteran Listrik PLN (KWH & Segel)',
 timestamp: '2026-03-28 10:16:05',
 lat: -6.229731,
 lng: 106.845608,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'electricity_meter',
 imageUrl: '/survey_pln_meter.jfif',
 },
 {
 id: 'PHT-03',
 caption: 'Foto Surveyor dengan Pemohon',
 timestamp: '2026-10-27 11:32:00',
 lat: -6.2385,
 lng: 106.8534,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'selfie_with_applicant'
 }
 ]
 },
 voice: case0941CleanVoiceVerification,
 auditTrail: [
 { id: 'A-1', timestamp: '2026-10-27 14:15:20', actor: 'Sistem LOS BAF', action: 'Submit Pengajuan', notes: 'Pengajuan masuk dari Dealer Yamaha Jaya Motor Jaksel' },
 { id: 'A-2', timestamp: '2026-10-27 14:16:02', actor: 'Engine OCR VeriFin', action: 'Ekstraksi Dokumen', notes: 'Ekstraksi 10 field e-KTP selesai (confidence rata-rata 93.1%)' },
 { id: 'A-3', timestamp: '2026-10-27 14:16:45', actor: 'Engine Geo VeriFin', action: 'Validasi Lokasi Survei', notes: 'Validasi titik survei: Jarak 32 meter dari alamat KTP (Zona Hijau / Valid)' },
 { id: 'A-4', timestamp: '2026-10-27 14:18:10', actor: 'Engine Voice VeriFin', action: 'Analisis Rekaman Suara', notes: 'ASR & Diarization selesai, tele-verifikasi terverifikasi' },
 { id: 'A-5', timestamp: '2026-10-27 14:18:12', actor: 'Risk Engine VeriFin', action: 'Kalkulasi Skor Risiko', notes: 'Skor: 15 (Risiko Rendah / Hijau). Rekomendasi lolos verifikasi.' }
 ]
 },
 {
 id: 'CASE-0942',
 applicationNumber: 'BAF-APP-2026-0942',
 submittedAt: '2026-10-27 13:40:00',
 customerName: 'Siti Nurhaliza',
 customerNik: '3174021408890002',
 customerPhone: '0813-1122-8970',
 branch: 'BAF Jakarta Selatan',
 vehicleModel: 'Yamaha Grand Filano Hybrid',
 downPayment: 4200000,
 loanAmount: 19800000,
 tenorMonths: 23,
 monthlyInstallment: 1045000,
 status: 'approved',
 riskScore: {
 totalScore: 16,
 level: 'low',
 recommendation: 'Lolos Otomatis: Data KTP, titik survei rumah, dan konfirmasi telepon valid tanpa anomali.',
 pillars: {
 ektp: { score: 12, weight: 30, weightedScore: 3.6 },
 location: { score: 10, weight: 30, weightedScore: 3.0 },
 voice: { score: 18, weight: 25, weightedScore: 4.5 },
 document: { score: 14, weight: 15, weightedScore: 2.1 },
 },
 reasons: [
 'Struktur NIK valid sesuai aturan Dukcapil DKI Jakarta',
 'Jarak survei 105 meter dari titik alamat (zona hijau ≤200 m)',
 'Foto fisik rumah dan meteran KWH terverifikasi kamera in-app tanpa rekayasa',
 'Tele-verifikasi lancar: kepatuhan script 98%, tidak ada jeda keraguan'
 ]
 },
 document: {
 ktpImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
 selfieImageUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
 slipGajiImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
 tamperScore: 12,
 faceMatchScore: 97,
 isScreenCaptureDetected: false,
 isPhysicalCopy: true,
 score: 12,
 tamperFlags: [],
 nikValidation: {
 nik: '3174021408890002',
 isValidStructure: true,
 province: '31 - DKI JAKARTA',
 regency: '74 - JAKARTA SELATAN',
 district: '02 - PASAR MINGGU',
 birthDate: '14-08-1989',
 gender: 'Perempuan',
 sequenceNumber: '0002',
 dukcapilMatch: true,
 anomalies: []
 },
 ocrFields: {
 nik: { label: 'NIK', value: '3174021408890002', confidence: 99, isAnomaly: false },
 nama: { label: 'Nama Lengkap', value: 'SITI NURHALIZA', confidence: 98, isAnomaly: false },
 tempatLahir: { label: 'Tempat Lahir', value: 'JAKARTA', confidence: 98, isAnomaly: false },
 tglLahir: { label: 'Tgl Lahir', value: '14-08-1989', confidence: 99, isAnomaly: false },
 jenisKelamin: { label: 'Jenis Kelamin', value: 'PEREMPUAN', confidence: 99, isAnomaly: false },
 alamat: { label: 'Alamat', value: 'JL. PEJATEN BARAT NO. 45 RT 003 RW 007', confidence: 97, isAnomaly: false },
 kelDesa: { label: 'Kel/Desa', value: 'PEJATEN BARAT', confidence: 98, isAnomaly: false },
 kecamatan: { label: 'Kecamatan', value: 'PASAR MINGGU', confidence: 99, isAnomaly: false },
 agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
 pekerjaan: { label: 'Pekerjaan', value: 'PEGAWAI BUMN', confidence: 96, isAnomaly: false }
 }
 },
 geo: {
 surveyorName: 'Bambang Sudirgo',
 surveyorId: 'SRV-JKT-104',
 surveyTimestamp: '2026-10-27 10:15:40',
 targetAddress: 'Jl. Pejaten Barat No. 45 RT 003 RW 007, Pejaten Barat, Pasar Minggu, Jakarta Selatan',
 targetLat: -6.2750,
 targetLng: 106.8320,
 surveyLat: -6.2758,
 surveyLng: 106.8325,
 distanceMeters: 105,
 distanceStatus: 'green',
 isMockLocationDetected: false,
 score: 10,
 surveyPhotos: [
 {
 id: 'PHT-21',
 caption: 'Tampak Depan Rumah Konsumen',
 timestamp: '2026-10-27 10:14:02',
 lat: -6.2758,
 lng: 106.8325,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'house_front'
 },
 {
 id: 'PHT-22',
 caption: 'Foto Meteran Listrik (KWH)',
 timestamp: '2026-10-27 10:15:10',
 lat: -6.2758,
 lng: 106.8325,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'electricity_meter'
 }
 ]
 },
 voice: {
 callId: 'CALL-20261027-7719',
 callDuration: 180,
 agentName: 'Fitri Handayani',
 agentId: 'AGT-044',
 callTimestamp: '2026-10-27 12:20:00',
 audioDurationFormatted: '03:00',
 overallHesitancyCount: 0,
 spellingAccuracyScore: 98,
 scriptComplianceScore: 98,
 score: 18,
 voiceFlags: [],
 complianceChecklist: [
 { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri', isCompliant: true, timestampRef: 3 },
 { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & NIK pemohon', isCompliant: true, timestampRef: 24 },
 { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung', isCompliant: true, timestampRef: 48 },
 { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit Yamaha Grand Filano Hybrid & cicilan', isCompliant: true, timestampRef: 80 },
 { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 110 },
 { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman OJK', isCompliant: true, timestampRef: 165 }
 ],
 transcripts: [
 { id: 'T-21', speaker: 'agent', startTime: 0, endTime: 5, text: 'Selamat siang Ibu Siti Nurhaliza, saya Fitri dari Verifikasi BAF.' },
 { id: 'T-22', speaker: 'customer', startTime: 6, endTime: 9, text: 'Selamat siang Mbak Fitri, iya benar saya sendiri.' },
 { id: 'T-23', speaker: 'agent', startTime: 10, endTime: 18, text: 'Boleh dibantu konfirmasi tanggal lahir dan nama ibu kandung ya Ibu Siti?' },
 { id: 'T-24', speaker: 'customer', startTime: 19, endTime: 27, text: 'Tanggal empat belas Agustus delapan puluh sembilan, ibu kandung Maryati.' },
 { id: 'T-25', speaker: 'agent', startTime: 28, endTime: 38, text: 'Cocok sekali. Pengajuan unit Yamaha Grand Filano Hybrid cicilan Rp 1.045.000 selama 23 bulan, benar ya Bu?' },
 { id: 'T-26', speaker: 'customer', startTime: 39, endTime: 44, text: 'Betul Mbak, sudah sesuai dengan simulasi kemarin.' }
 ]
 },
 auditTrail: [
 { id: 'A-21', timestamp: '2026-10-27 13:40:00', actor: 'Sistem LOS BAF', action: 'Submit Pengajuan', notes: 'Pengajuan online via Aplikasi BAF Mobile' },
 { id: 'A-22', timestamp: '2026-10-27 13:42:15', actor: 'Risk Engine VeriFin', action: 'Evaluasi Otomatis', notes: 'Skor: 16 (Hijau / Risiko Rendah). Kriteria lolos otomatis terpenuhi.' },
 { id: 'A-23', timestamp: '2026-10-27 13:45:00', actor: 'Sistem BAF', action: 'Persetujuan Otomatis', notes: 'Pengajuan disetujui otomatis.' }
 ],
 decisionNotes: 'Lolos verifikasi otomatis. Semua pilar risiko dalam ambang batas aman.',
 decisionTimestamp: '2026-10-27 13:45:00'
 },
 {
 id: 'CASE-0943',
 applicationNumber: 'BAF-APP-2026-0943',
 submittedAt: '2026-10-27 12:10:00',
 customerName: 'Doni Kurniawan',
 customerNik: '3275022511940004',
 customerPhone: '0817-4455-6677',
 branch: 'BAF Kota Bekasi',
 vehicleModel: 'Yamaha XMAX 250',
 downPayment: 4800000,
 loanAmount: 26500000,
 tenorMonths: 29,
 monthlyInstallment: 1240000,
 status: 'pending',
 riskScore: {
 totalScore: 88,
 level: 'high',
 recommendation: 'Tolak Pengajuan: Manipulasi lokasi survei terdeteksi (Mock GPS / Fake GPS aktif pada perangkat surveyor).',
 pillars: {
 ektp: { score: 85, weight: 30, weightedScore: 25.5 },
 location: { score: 95, weight: 30, weightedScore: 28.5 },
 voice: { score: 85, weight: 25, weightedScore: 21.25 },
 document: { score: 85, weight: 15, weightedScore: 12.75 },
 },
 reasons: [
 'Manipulasi lokasi survei: Fake GPS terdeteksi pada perangkat surveyor',
 'Android Mock Location Provider aktif saat pengambilan foto survei (isFromMockProvider = true)',
 'Integritas data geolokasi tidak valid: titik koordinat survei tidak dapat diverifikasi',
 'Indikasi fraud survei lapangan terencana memerlukan investigasi unit kepatuhan'
 ]
 },
 document: {
 ktpImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
 selfieImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
 tamperScore: 35,
 faceMatchScore: 89,
 isScreenCaptureDetected: false,
 isPhysicalCopy: true,
 score: 35,
 tamperFlags: [
 'Sedikit pantulan cahaya silau pada area foto KTP sudut kanan bawah'
 ],
 nikValidation: {
 nik: '3275022511940004',
 isValidStructure: true,
 province: '32 - JAWA BARAT',
 regency: '75 - KOTA BEKASI',
 district: '02 - BEKASI SELATAN',
 birthDate: '25-11-1994',
 gender: 'Laki-laki',
 sequenceNumber: '0004',
 dukcapilMatch: true,
 anomalies: []
 },
 ocrFields: {
 nik: { label: 'NIK', value: '3275022511940004', confidence: 96, isAnomaly: false },
 nama: { label: 'Nama Lengkap', value: 'DONI KURNIAWAN', confidence: 97, isAnomaly: false },
 tempatLahir: { label: 'Tempat Lahir', value: 'BEKASI', confidence: 98, isAnomaly: false },
 tglLahir: { label: 'Tgl Lahir', value: '25-11-1994', confidence: 97, isAnomaly: false },
 jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 99, isAnomaly: false },
 alamat: { label: 'Alamat', value: 'JL. HARAPAN INDAH RAYA NO. 15 RT 004 RW 006', confidence: 95, isAnomaly: false },
 kelDesa: { label: 'Kel/Desa', value: 'PEJUANG', confidence: 95, isAnomaly: false },
 kecamatan: { label: 'Kecamatan', value: 'MEDAN SATRIA', confidence: 96, isAnomaly: false },
 agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
 pekerjaan: { label: 'Pekerjaan', value: 'WIRAUSAHA', confidence: 89, isAnomaly: false }
 }
 },
 geo: {
 surveyorName: 'Agus Setiawan',
 surveyorId: 'SRV-BKS-019',
 surveyTimestamp: '2026-10-27 10:45:10',
 targetAddress: 'Jl. Harapan Indah Raya No. 15 RT 004 RW 006, Pejuang, Medan Satria, Kota Bekasi',
 targetLat: -6.1850,
 targetLng: 106.9750,
 surveyLat: -6.1851,
 surveyLng: 106.9752,
 distanceMeters: 25,
 distanceStatus: 'red',
 isMockLocationDetected: true,
 mockLocationReason: 'Android Location API: isFromMockProvider = true (Aplikasi terdeteksi: Fake GPS Location 4.2)',
 score: 68,
 surveyPhotos: [
 {
 id: 'PHT-31',
 caption: 'Foto Gapura Masuk Perumahan & Surveyor',
 timestamp: '2026-10-27 10:44:00',
 lat: -6.1851,
 lng: 106.9752,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'street_view'
 },
 {
 id: 'PHT-32',
 caption: 'Foto Rumah Harapan Indah',
 timestamp: '2026-10-27 10:45:00',
 lat: -6.1851,
 lng: 106.9752,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'house_front'
 }
 ]
 },
 voice: {
 callId: 'CALL-20261027-6612',
 callDuration: 210,
 agentName: 'Rudi Hartono',
 agentId: 'AGT-012',
 callTimestamp: '2026-10-27 11:30:00',
 audioDurationFormatted: '03:30',
 overallHesitancyCount: 1,
 spellingAccuracyScore: 92,
 scriptComplianceScore: 94,
 score: 42,
 voiceFlags: [
 'Jeda 2.1 detik saat menyebutkan tanggal penerimaan omzet bulanan'
 ],
 complianceChecklist: [
 { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri', isCompliant: true, timestampRef: 2 },
 { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & NIK pemohon', isCompliant: true, timestampRef: 20 },
 { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung', isCompliant: true, timestampRef: 42 },
 { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit Yamaha XMAX 250', isCompliant: true, timestampRef: 75 },
 { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 120 },
 { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman OJK', isCompliant: true, timestampRef: 190 }
 ],
 transcripts: [
 { id: 'T-31', speaker: 'agent', startTime: 0, endTime: 6, text: 'Halo selamat siang dengan Bapak Doni Kurniawan? Saya Rudi dari BAF.' },
 { id: 'T-32', speaker: 'customer', startTime: 7, endTime: 10, text: 'Siang Mas Rudi, ya benar saya Doni.' },
 { id: 'T-33', speaker: 'agent', startTime: 11, endTime: 20, text: 'Menindaklanjuti survei untuk pengajuan Yamaha XMAX 250. Alamat domisili saat ini di Harapan Indah ya Pak?' },
 { id: 'T-34', speaker: 'customer', startTime: 21, endTime: 30, text: 'Iya betul Mas, rumah saya di Harapan Indah No. 15.' }
 ]
 },
 auditTrail: [
 { id: 'A-31', timestamp: '2026-10-27 12:10:00', actor: 'Sistem LOS BAF', action: 'Submit Pengajuan', notes: 'Dari Dealer Yamaha Kebon Jeruk' },
 { id: 'A-32', timestamp: '2026-10-27 12:12:40', actor: 'Risk Engine VeriFin', action: 'Kalkulasi Risiko', notes: 'Skor: 88 (Merah / Risiko Tinggi - Fake GPS terdeteksi)' }
 ]
 },
 {
 id: 'CASE-0944',
 applicationNumber: 'BAF-APP-2026-0944',
 submittedAt: '2026-10-27 11:20:00',
 customerName: 'Hendra Wijaya',
 customerNik: '3275010903920003',
 customerPhone: '0856-7890-1234',
 branch: 'BAF Kota Bekasi',
 vehicleModel: 'Yamaha Aerox 155 CyberCity',
 downPayment: 3900000,
 loanAmount: 22800000,
 tenorMonths: 35,
 monthlyInstallment: 998000,
 status: 'resurvey',
 riskScore: {
 totalScore: 48,
 level: 'medium',
 recommendation: 'Minta Survei Ulang: Kualitas foto fisik rumah buram/gelap akibat hujan lebat; akurasi GPS surveyor rendah (>65m).',
 pillars: {
 ektp: { score: 18, weight: 30, weightedScore: 5.4 },
 location: { score: 74, weight: 30, weightedScore: 22.2 },
 voice: { score: 26, weight: 25, weightedScore: 6.5 },
 document: { score: 25, weight: 15, weightedScore: 3.75 },
 },
 reasons: [
 'Foto fisik rumah dan plang nomor rumah buram/tidak terbaca (camera blur)',
 'GPS accuracy radius 72 meter karena cuaca hujan lebat di Bekasi Utara',
 'Data e-KTP dan tele-verifikasi valid; hanya memerlukan foto ulang verifikasi lokasi saat cuaca cerah'
 ]
 },
 document: {
 ktpImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
 selfieImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
 tamperScore: 18,
 faceMatchScore: 94,
 isScreenCaptureDetected: false,
 isPhysicalCopy: true,
 score: 18,
 tamperFlags: [],
 nikValidation: {
 nik: '3275010903920003',
 isValidStructure: true,
 province: '32 - JAWA BARAT',
 regency: '75 - KOTA BEKASI',
 district: '01 - BEKASI TIMUR',
 birthDate: '09-03-1992',
 gender: 'Laki-laki',
 sequenceNumber: '0003',
 dukcapilMatch: true,
 anomalies: []
 },
 ocrFields: {
 nik: { label: 'NIK', value: '3275010903920003', confidence: 98, isAnomaly: false },
 nama: { label: 'Nama Lengkap', value: 'HENDRA WIJAYA', confidence: 99, isAnomaly: false },
 tempatLahir: { label: 'Tempat Lahir', value: 'BEKASI', confidence: 99, isAnomaly: false },
 tglLahir: { label: 'Tgl Lahir', value: '09-03-1992', confidence: 98, isAnomaly: false },
 jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 99, isAnomaly: false },
 alamat: { label: 'Alamat', value: 'JL. BOULEVARD AHMAD YANI NO. 88 RT 002 RW 010', confidence: 96, isAnomaly: false },
 kelDesa: { label: 'Kel/Desa', value: 'MARGA MULYA', confidence: 97, isAnomaly: false },
 kecamatan: { label: 'Kecamatan', value: 'BEKASI UTARA', confidence: 98, isAnomaly: false },
 agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
 pekerjaan: { label: 'Pekerjaan', value: 'KARYAWAN SWASTA', confidence: 95, isAnomaly: false }
 }
 },
 geo: {
 surveyorName: 'Agus Setiawan',
 surveyorId: 'SRV-BKS-019',
 surveyTimestamp: '2026-10-27 09:30:00',
 targetAddress: 'Jl. Boulevard Ahmad Yani No. 88 RT 002 RW 010, Marga Mulya, Bekasi Utara, Kota Bekasi',
 targetLat: -6.2350,
 targetLng: 106.9950,
 surveyLat: -6.2385,
 surveyLng: 106.9970,
 distanceMeters: 445,
 distanceStatus: 'yellow',
 isMockLocationDetected: false,
 score: 74,
 surveyPhotos: [
 {
 id: 'PHT-41',
 caption: 'Foto Rumah (Buram karena Hujan Lebat)',
 timestamp: '2026-10-27 09:29:00',
 lat: -6.2385,
 lng: 106.9970,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'house_front'
 }
 ]
 },
 voice: {
 callId: 'CALL-20261027-5511',
 callDuration: 195,
 agentName: 'Fitri Handayani',
 agentId: 'AGT-044',
 callTimestamp: '2026-10-27 10:40:00',
 audioDurationFormatted: '03:15',
 overallHesitancyCount: 0,
 spellingAccuracyScore: 96,
 scriptComplianceScore: 96,
 score: 26,
 voiceFlags: [],
 complianceChecklist: [
 { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri', isCompliant: true, timestampRef: 2 },
 { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & NIK pemohon', isCompliant: true, timestampRef: 22 },
 { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung', isCompliant: true, timestampRef: 45 },
 { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit Yamaha Aerox 155 CyberCity', isCompliant: true, timestampRef: 80 },
 { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 115 },
 { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman OJK', isCompliant: true, timestampRef: 170 }
 ],
 transcripts: [
 { id: 'T-41', speaker: 'agent', startTime: 0, endTime: 5, text: 'Selamat pagi Bapak Hendra Wijaya, saya Fitri dari Verifikasi BAF.' },
 { id: 'T-42', speaker: 'customer', startTime: 6, endTime: 9, text: 'Pagi Mbak Fitri, iya benar saya sendiri.' }
 ]
 },
 auditTrail: [
 { id: 'A-41', timestamp: '2026-10-27 11:20:00', actor: 'Sistem LOS BAF', action: 'Submit Pengajuan', notes: 'Dari Dealer Yamaha Ahmad Yani Bekasi' },
 { id: 'A-42', timestamp: '2026-10-27 11:45:00', actor: 'Dian Pratama (Verifikator)', action: 'Putusan: Survei Ulang', notes: 'Foto fisik rumah tidak jelas, butuh re-take saat siang cerah.' }
 ],
 decisionNotes: 'Membutuhkan kunjungan ulang surveyor untuk foto bukti rumah yang tajam dan pencahayaan memadai.',
 decisionTimestamp: '2026-10-27 11:45:00'
 },
 {
 id: 'CASE-0945',
 applicationNumber: 'BAF-APP-2026-0945',
 submittedAt: '2026-10-27 10:05:00',
 customerName: 'Ahmad Fauzi Pratama',
 customerNik: '3204121003950004',
 customerPhone: '0812-3344-5566',
 branch: 'BAF Bandung Soekarno-Hatta',
 vehicleModel: 'Yamaha XSR 155 Heritage',
 downPayment: 6200000,
 loanAmount: 32000000,
 tenorMonths: 35,
 monthlyInstallment: 1420000,
 status: 'approved',
 riskScore: {
 totalScore: 22,
 level: 'low',
 recommendation: 'Lolos Otomatis: Seluruh indikator verifikasi hijau dan valid.',
 pillars: {
 ektp: { score: 15, weight: 30, weightedScore: 4.5 },
 location: { score: 18, weight: 30, weightedScore: 5.4 },
 voice: { score: 25, weight: 25, weightedScore: 6.25 },
 document: { score: 20, weight: 15, weightedScore: 3.0 },
 },
 reasons: [
 'NIK valid sesuai data Dukcapil Jawa Barat (Kabupaten Bandung)',
 'Jarak survei 52 meter dari alamat KTP (zona hijau ≤200 m)',
 'Semua dokumen pendukung (KTP, Kartu Keluarga, Rekening Listrik) sinkron'
 ]
 },
 document: {
 ktpImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
 selfieImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
 tamperScore: 15,
 faceMatchScore: 95,
 isScreenCaptureDetected: false,
 isPhysicalCopy: true,
 score: 15,
 tamperFlags: [],
 nikValidation: {
 nik: '3204121003950004',
 isValidStructure: true,
 province: '32 - JAWA BARAT',
 regency: '04 - KABUPATEN BANDUNG',
 district: '12 - BALEENDAH',
 birthDate: '10-03-1995',
 gender: 'Laki-laki',
 sequenceNumber: '0004',
 dukcapilMatch: true,
 anomalies: []
 },
 ocrFields: {
 nik: { label: 'NIK', value: '3204121003950004', confidence: 99, isAnomaly: false },
 nama: { label: 'Nama Lengkap', value: 'AHMAD FAUZI PRATAMA', confidence: 98, isAnomaly: false },
 tempatLahir: { label: 'Tempat Lahir', value: 'BANDUNG', confidence: 99, isAnomaly: false },
 tglLahir: { label: 'Tgl Lahir', value: '10-03-1995', confidence: 99, isAnomaly: false },
 jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 99, isAnomaly: false },
 alamat: { label: 'Alamat', value: 'JL. RAYA BALEENDAH NO. 42', confidence: 97, isAnomaly: false },
 kelDesa: { label: 'Kel/Desa', value: 'BALEENDAH', confidence: 98, isAnomaly: false },
 kecamatan: { label: 'Kecamatan', value: 'BALEENDAH', confidence: 99, isAnomaly: false },
 agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
 pekerjaan: { label: 'Pekerjaan', value: 'KARYAWAN BUMN', confidence: 96, isAnomaly: false }
 }
 },
 geo: {
 surveyorName: 'Cecep Supriatna',
 surveyorId: 'SRV-BDG-031',
 surveyTimestamp: '2026-10-27 08:50:00',
 targetAddress: 'Jl. Raya Baleendah No. 42 RT 003 RW 006, Baleendah, Bandung',
 targetLat: -6.995120,
 targetLng: 107.625410,
 surveyLat: -6.995200,
 surveyLng: 107.625600,
 distanceMeters: 52,
 distanceStatus: 'green',
 isMockLocationDetected: false,
 score: 18,
 surveyPhotos: [
 {
 id: 'PHT-51',
 caption: 'Foto Tampak Depan Rumah',
 timestamp: '2026-10-27 08:48:00',
 lat: -6.995200,
 lng: 107.625600,
 isFromInAppCamera: true,
 hasExifTamper: false,
 photoType: 'house_front'
 }
 ]
 },
 voice: {
 callId: 'CALL-20261027-4402',
 callDuration: 200,
 agentName: 'Rudi Hartono',
 agentId: 'AGT-012',
 callTimestamp: '2026-10-27 09:30:00',
 audioDurationFormatted: '03:20',
 overallHesitancyCount: 0,
 spellingAccuracyScore: 97,
 scriptComplianceScore: 98,
 score: 25,
 voiceFlags: [],
 complianceChecklist: [
 { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri', isCompliant: true, timestampRef: 2 },
 { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & NIK pemohon', isCompliant: true, timestampRef: 20 },
 { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung', isCompliant: true, timestampRef: 45 },
 { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit Yamaha XSR 155', isCompliant: true, timestampRef: 80 },
 { id: 'SC-5', category: 'Pembiayaan', requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo', isCompliant: true, timestampRef: 120 },
 { id: 'SC-6', category: 'Penutup', requirement: 'Pernyataan klausul persetujuan & rekaman OJK', isCompliant: true, timestampRef: 180 }
 ],
 transcripts: [
 { id: 'T-51', speaker: 'agent', startTime: 0, endTime: 5, text: 'Selamat pagi Mas Ahmad Fauzi, saya Rudi dari BAF Bandung.' },
 { id: 'T-52', speaker: 'customer', startTime: 6, endTime: 9, text: 'Pagi Pak Rudi, ada apa ya?' }
 ]
 },
 auditTrail: [
 { id: 'A-51', timestamp: '2026-10-27 10:05:00', actor: 'Sistem LOS BAF', action: 'Submit Pengajuan', notes: 'Dari Dealer Yamaha Berlian Motor Bandung' },
 { id: 'A-52', timestamp: '2026-10-27 10:15:00', actor: 'Risk Engine VeriFin', action: 'Auto-Approval', notes: 'Skor: 22 (Hijau / Risiko Rendah). Disetujui otomatis.' }
 ],
 decisionNotes: 'Pengajuan disetujui otomatis. Kredensial dan geolokasi prima.',
 decisionTimestamp: '2026-10-27 10:15:00'
 },
 {
 id: 'CASE-0946',
 applicationNumber: 'BAF-APP-2026-0946',
 submittedAt: '2026-10-27 09:15:00',
 customerName: 'Hendra Irawan',
 customerNik: '3171011505880007',
 customerPhone: '0819-2233-4455',
 branch: 'BAF Jakarta Pusat',
 vehicleModel: 'Yamaha All New NMAX 155 Connected',
 downPayment: 5000000,
 loanAmount: 31000000,
 tenorMonths: 35,
 monthlyInstallment: 1385000,
 status: 'rejected_fraud',
 riskScore: {
 totalScore: 91,
 level: 'high',
 recommendation: 'Tolak & Catat Fraud: NIK terdeteksi duplikasi ganda dalam sistem BAF dengan pasfoto wajah berbeda.',
 pillars: {
 ektp: { score: 95, weight: 30, weightedScore: 28.5 },
 location: { score: 88, weight: 30, weightedScore: 26.4 },
 voice: { score: 90, weight: 25, weightedScore: 22.5 },
 document: { score: 90, weight: 15, weightedScore: 13.5 },
 },
 reasons: [
 'NIK 3171011505880007 pernah diajukan 3 bulan lalu atas nama Bambang Hermanto',
 'Face match dengan arsip pengajuan lama menghasilkan similarity score 18% (orang berbeda)',
 'Foto KTP terindikasi diganti pasfoto secara digital (tamper overlay boundary)',
 'Panggilan telepon verifikasi dialihkan ke nomor sindikat percaloan pihak ketiga'
 ]
 },
 document: {
 ktpImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
 selfieImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
 tamperScore: 95,
 faceMatchScore: 18,
 isScreenCaptureDetected: true,
 isPhysicalCopy: false,
 score: 95,
 tamperFlags: [
 'Pasfoto KTP ditempel / diganti secara digital',
 'Duplikasi NIK dengan pengajuan aktif di cabang BAF Jakarta Timur'
 ],
 nikValidation: {
 nik: '3171011505880007',
 isValidStructure: true,
 province: '31 - DKI JAKARTA',
 regency: '71 - JAKARTA PUSAT',
 district: '01 - GAMBIR',
 birthDate: '15-05-1988',
 gender: 'Laki-laki',
 sequenceNumber: '0007',
 dukcapilMatch: false,
 anomalies: ['NIK pernah tercatat dengan nama konsumen berbeda (Peringatan Sindikat Fraud)']
 },
 ocrFields: {
 nik: { label: 'NIK', value: '3171011505880007', confidence: 96, isAnomaly: true, anomalyReason: 'Duplikasi NIK antar nasabah berbeda' },
 nama: { label: 'Nama Lengkap', value: 'HENDRA IRAWAN', confidence: 97, isAnomaly: true, anomalyReason: 'Nama tidak cocok dengan arsip pemilik NIK asli' },
 tempatLahir: { label: 'Tempat Lahir', value: 'JAKARTA', confidence: 98, isAnomaly: false },
 tglLahir: { label: 'Tgl Lahir', value: '15-05-1988', confidence: 98, isAnomaly: false },
 jenisKelamin: { label: 'Jenis Kelamin', value: 'LAKI-LAKI', confidence: 99, isAnomaly: false },
 alamat: { label: 'Alamat', value: 'JL. KEBON SIRIH NO. 15', confidence: 92, isAnomaly: false },
 kelDesa: { label: 'Kel/Desa', value: 'GAMBIR', confidence: 95, isAnomaly: false },
 kecamatan: { label: 'Kecamatan', value: 'GAMBIR', confidence: 96, isAnomaly: false },
 agama: { label: 'Agama', value: 'ISLAM', confidence: 99, isAnomaly: false },
 pekerjaan: { label: 'Pekerjaan', value: 'SWASTA', confidence: 92, isAnomaly: false }
 }
 },
 geo: {
 surveyorName: 'Bambang Sudirgo',
 surveyorId: 'SRV-JKT-104',
 surveyTimestamp: '2026-10-27 08:30:00',
 targetAddress: 'Jl. Kebon Sirih No. 15, Gambir, Jakarta Pusat',
 targetLat: -6.182410,
 targetLng: 106.831200,
 surveyLat: -6.199400,
 surveyLng: 106.845000,
 distanceMeters: 2150,
 distanceStatus: 'red',
 isMockLocationDetected: true,
 mockLocationReason: 'FakeGPS Provider aktif pada perangkat surveyor',
 score: 88,
 surveyPhotos: [
 {
 id: 'PHT-61',
 caption: 'Foto Gedung Kantor Komersial (Bukan Tempat Tinggal)',
 timestamp: '2026-10-27 08:28:00',
 lat: -6.199400,
 lng: 106.845000,
 isFromInAppCamera: true,
 hasExifTamper: true,
 photoType: 'street_view'
 }
 ]
 },
 voice: {
 callId: 'CALL-20261027-3310',
 callDuration: 120,
 agentName: 'Fitri Handayani',
 agentId: 'AGT-044',
 callTimestamp: '2026-10-27 09:00:00',
 audioDurationFormatted: '02:00',
 overallHesitancyCount: 4,
 spellingAccuracyScore: 50,
 scriptComplianceScore: 70,
 score: 90,
 voiceFlags: [
 'Konsumen tidak hafal NIK dan tanggal lahir sendiri',
 'Terdengar suara bisikan pihak ketiga (calo/arahan) di latar belakang audio'
 ],
 complianceChecklist: [
 { id: 'SC-1', category: 'Pembuka', requirement: 'Salam standar BAF & perkenalan diri', isCompliant: true, timestampRef: 2 },
 { id: 'SC-2', category: 'Verifikasi', requirement: 'Konfirmasi nama lengkap & NIK pemohon', isCompliant: false, timestampRef: 25, note: 'Konsumen salah sebut angka' },
 { id: 'SC-3', category: 'Verifikasi', requirement: 'Verifikasi nama gadis ibu kandung', isCompliant: false, timestampRef: 50, note: 'Terdengar bisikan pihak ketiga' },
 { id: 'SC-4', category: 'Pembiayaan', requirement: 'Konfirmasi unit kendaraan Yamaha NMAX', isCompliant: true, timestampRef: 80 }
 ],
 transcripts: [
 { id: 'T-61', speaker: 'agent', startTime: 0, endTime: 6, text: 'Selamat pagi, saya Fitri dari Verifikasi BAF menghubungi Pak Hendra Irawan.' },
 { id: 'T-62', speaker: 'customer', startTime: 7, endTime: 15, text: 'Halo... iya Mbak... [terdengar suara pria lain berbisik: bilang iya Hendra]' }
 ]
 },
 auditTrail: [
 { id: 'A-61', timestamp: '2026-10-27 09:15:00', actor: 'Sistem LOS BAF', action: 'Submit Pengajuan', notes: 'Pengajuan dari broker perantara' },
 { id: 'A-62', timestamp: '2026-10-27 09:40:00', actor: 'Aditya (Verifikator Senior)', action: 'Putusan: Tolak & Blacklist', notes: 'Sindikat pemalsuan KTP dan percaloan motor.' }
 ],
 decisionNotes: 'Ditolak dan dicatat dalam daftar hitam fraud nasional. NIK ganda & percaloan terindikasi.',
 decisionTimestamp: '2026-10-27 09:40:00'
 }
];

export const mockSurveyPoints: SurveyorPoint[] = [
 {
 id: 'PT-01',
 caseId: 'CASE-0941',
 applicantName: 'Ahmad Fauzi',
 vehicleModel: 'Yamaha NMAX 155 Connected',
 branch: 'BAF Jakarta Selatan',
 surveyorName: 'Bambang Sudirgo',
 targetLat: -6.2383,
 targetLng: 106.8532,
 surveyLat: -6.2385,
 surveyLng: 106.8534,
 distanceMeters: 32,
 status: 'green',
 isMockLocation: false,
 surveyTime: '11:32 WIB'
 },
 {
 id: 'PT-02',
 caseId: 'CASE-0942',
 applicantName: 'Siti Nurhaliza',
 vehicleModel: 'Yamaha Grand Filano Hybrid',
 branch: 'BAF Jakarta Selatan',
 surveyorName: 'Bambang Sudirgo',
 targetLat: -6.2750,
 targetLng: 106.8320,
 surveyLat: -6.2758,
 surveyLng: 106.8325,
 distanceMeters: 105,
 status: 'green',
 isMockLocation: false,
 surveyTime: '10:15 WIB'
 },
 {
 id: 'PT-03',
 caseId: 'CASE-0943',
 applicantName: 'Doni Kurniawan',
 vehicleModel: 'Yamaha XMAX 250',
 branch: 'BAF Kota Bekasi',
 surveyorName: 'Agus Setiawan',
 targetLat: -6.1850,
 targetLng: 106.9750,
 surveyLat: -6.1851,
 surveyLng: 106.9752,
 distanceMeters: 25,
 status: 'red',
 isMockLocation: true,
 surveyTime: '10:45 WIB'
 },
 {
 id: 'PT-04',
 caseId: 'CASE-0944',
 applicantName: 'Hendra Wijaya',
 vehicleModel: 'Yamaha Aerox 155 CyberCity',
 branch: 'BAF Kota Bekasi',
 surveyorName: 'Agus Setiawan',
 targetLat: -6.2350,
 targetLng: 106.9950,
 surveyLat: -6.2385,
 surveyLng: 106.9970,
 distanceMeters: 445,
 status: 'yellow',
 isMockLocation: false,
 surveyTime: '09:30 WIB'
 },
 {
 id: 'PT-05',
 caseId: 'CASE-0945',
 applicantName: 'Ahmad Fauzi Pratama',
 vehicleModel: 'Yamaha XSR 155',
 branch: 'BAF Bandung Soekarno-Hatta',
 surveyorName: 'Cecep Supriatna',
 targetLat: -6.995120,
 targetLng: 107.625410,
 surveyLat: -6.995200,
 surveyLng: 107.625600,
 distanceMeters: 52,
 status: 'green',
 isMockLocation: false,
 surveyTime: '08:50 WIB'
 },
 {
 id: 'PT-06',
 caseId: 'CASE-0946',
 applicantName: 'Hendra Irawan',
 vehicleModel: 'Yamaha All New NMAX 155 Connected',
 branch: 'BAF Jakarta Pusat',
 surveyorName: 'Bambang Sudirgo',
 targetLat: -6.182410,
 targetLng: 106.831200,
 surveyLat: -6.199400,
 surveyLng: 106.845000,
 distanceMeters: 2150,
 status: 'red',
 isMockLocation: true,
 surveyTime: '08:30 WIB'
 },
 {
 id: 'PT-07',
 caseId: 'CASE-0947',
 applicantName: 'Eko Wahyudi',
 vehicleModel: 'Yamaha MX King 150',
 branch: 'BAF Jakarta Timur',
 surveyorName: 'Indra Gunawan',
 targetLat: -6.225000,
 targetLng: 106.892000,
 surveyLat: -6.225150,
 surveyLng: 106.892200,
 distanceMeters: 28,
 status: 'green',
 isMockLocation: false,
 surveyTime: '09:10 WIB'
 },
 {
 id: 'PT-08',
 caseId: 'CASE-0948',
 applicantName: 'Yuliana Safitri',
 vehicleModel: 'Yamaha Fazzio Neo',
 branch: 'BAF Depok Margonda',
 surveyorName: 'Agus Setiawan',
 targetLat: -6.372100,
 targetLng: 106.832400,
 surveyLat: -6.375500,
 surveyLng: 106.834000,
 distanceMeters: 410,
 status: 'yellow',
 isMockLocation: false,
 surveyTime: '13:00 WIB'
 },
 {
 id: 'PT-09',
 caseId: 'CASE-0949',
 applicantName: 'Doni Saputra',
 vehicleModel: 'Yamaha Aerox 155 CyberCity',
 branch: 'BAF Tangerang Serpong',
 surveyorName: 'Ferry Pratama',
 targetLat: -6.262000,
 targetLng: 106.685000,
 surveyLat: -6.275000,
 surveyLng: 106.699000,
 distanceMeters: 1850,
 status: 'red',
 isMockLocation: true,
 surveyTime: '14:20 WIB'
 },
 {
 id: 'PT-10',
 caseId: 'CASE-0950',
 applicantName: 'Nurul Hidayati',
 vehicleModel: 'Yamaha Mio M3 125',
 branch: 'BAF Surabaya Timur',
 surveyorName: 'Dimas Wicaksono',
 targetLat: -7.265000,
 targetLng: 112.712000,
 surveyLat: -7.265200,
 surveyLng: 112.712100,
 distanceMeters: 25,
 status: 'green',
 isMockLocation: false,
 surveyTime: '11:00 WIB'
 },
 {
 id: 'PT-11',
 caseId: 'CASE-0951',
 applicantName: 'Rizky Kurniawan',
 vehicleModel: 'Yamaha All New R15 Connected',
 branch: 'BAF Bandung Soekarno-Hatta',
 surveyorName: 'Cecep Supriatna',
 targetLat: -6.892000,
 targetLng: 107.615000,
 surveyLat: -6.895500,
 surveyLng: 107.617000,
 distanceMeters: 480,
 status: 'yellow',
 isMockLocation: false,
 surveyTime: '14:50 WIB'
 },
 {
 id: 'PT-12',
 caseId: 'CASE-0952',
 applicantName: 'Budi Santoso',
 vehicleModel: 'Yamaha Gear 125 S',
 branch: 'BAF Semarang Pandanaran',
 surveyorName: 'Wawan Hartono',
 targetLat: -6.992000,
 targetLng: 110.418000,
 surveyLat: -6.992100,
 surveyLng: 110.418200,
 distanceMeters: 30,
 status: 'green',
 isMockLocation: false,
 surveyTime: '10:00 WIB'
 }
];

export const branchList = [
 'All Branches',
 'BAF Jakarta Selatan',
 'BAF Jakarta Barat',
 'BAF Jakarta Pusat',
 'BAF Jakarta Timur',
 'BAF Kota Bekasi',
 'BAF Depok Margonda',
 'BAF Tangerang Serpong',
 'BAF Bandung Soekarno-Hatta',
 'BAF Surabaya Timur',
 'BAF Semarang Pandanaran'
];
