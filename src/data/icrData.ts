export interface IcrDocumentSample {
 id: string;
 type: 'survey_form' | 'bpn_certificate';
 title: string;
 applicantName: string;
 caseId: string;
 scanDate: string;
 documentNumber: string;
 overallConfidence: number; // 0 - 100
 status: 'verified' | 'needs_review' | 'mismatch_flag';
 thumbnailUrl: string;
 summaryNote: string;
 extractedFields: {
 fieldKey: string;
 label: string;
 extractedValue: string;
 normalizedValue: string;
 confidence: number;
 isAnomaly: boolean;
 anomalyNote?: string;
 }[];
 bpnSpatialVerification?: {
 persilNib: string;
 shmNumber: string;
 surfaceAreaM2: number;
 districtOffice: string;
 registeredOwner: string;
 applicantRelation: string;
 latitude: number;
 longitude: number;
 spatialMatchWithSurveyAddress: boolean;
 sentuhTanahkuStatus: 'Terverifikasi BPN' | 'Sertipikat Belum Terplot' | 'Beda Nama Pemilik';
 };
}

export const mockIcrDocuments: IcrDocumentSample[] = [
 {
 id: 'ICR-DOC-001',
 type: 'survey_form',
 title: 'Formulir Survei Lapangan BAF (Tulisan Tangan CMO)',
 applicantName: 'Rian Hendrawan',
 caseId: 'CASE-0941',
 scanDate: '2026-10-27 11:35 WIB',
 documentNumber: 'SRV-FORM-2026-0941',
 overallConfidence: 74,
 status: 'needs_review',
 thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
 summaryNote: 'Terdapat 2 isian tulisan tangan dengan keyakinan di bawah 80% pada bagian daya listrik & penghasilan penjamin.',
 extractedFields: [
 {
 fieldKey: 'status_kepemilikan',
 label: 'Status Tempat Tinggal',
 extractedValue: 'Kontrak / Sewa Bulanan',
 normalizedValue: 'SEWA',
 confidence: 94,
 isAnomaly: false,
 },
 {
 fieldKey: 'daya_listrik',
 label: 'Kapasitas Listrik (PLN)',
 extractedValue: '900 VA (Token)',
 normalizedValue: '900_VA',
 confidence: 76,
 isAnomaly: true,
 anomalyNote: 'Tulisan angka 9 agak terpotong menyerupai 4, perlu konfirmasi dengan foto meteran.',
 },
 {
 fieldKey: 'lama_tinggal',
 label: 'Lama Menempati Domisili',
 extractedValue: '1 Tahun 4 Bulan',
 normalizedValue: '16_BULAN',
 confidence: 91,
 isAnomaly: false,
 },
 {
 fieldKey: 'nama_penjamin',
 label: 'Nama Penjamin / Kontak Darurat',
 extractedValue: 'Hasan Basri',
 normalizedValue: 'HASAN BASRI',
 confidence: 88,
 isAnomaly: false,
 },
 {
 fieldKey: 'penghasilan_tambahan',
 label: 'Est. Penghasilan Tambahan / Usaha',
 extractedValue: 'Rp 2.500.000',
 normalizedValue: '2500000',
 confidence: 71,
 isAnomaly: true,
 anomalyNote: 'Angka nol terakhir coret tipbal, perlu verifikasi verifikator.',
 },
 {
 fieldKey: 'catatan_lingkungan',
 label: 'Catatan Karakter Lingkungan RT/RW',
 extractedValue: 'Dikonfirmasi ketua RT 04 (Bpk. Mamat) konsumen aktif berdomisili.',
 normalizedValue: 'VALID_RT',
 confidence: 89,
 isAnomaly: false,
 }
 ]
 },
 {
 id: 'ICR-DOC-002',
 type: 'bpn_certificate',
 title: 'Sertipikat Hak Milik (SHM) Agunan Tambahan / Sentuh Tanahku',
 applicantName: 'Bagus Prasetyo',
 caseId: 'CASE-0943',
 scanDate: '2026-10-27 10:50 WIB',
 documentNumber: 'SHM-3174-05-01294',
 overallConfidence: 96,
 status: 'verified',
 thumbnailUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
 summaryNote: 'Validasi OCR dan pencocokan koordinat persil bidang tanah Sentuh Tanahku (Kementerian ATR/BPN) cocok 100%.',
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
 extractedValue: '09.01.05.02.04581',
 normalizedValue: '0901050204581',
 confidence: 98,
 isAnomaly: false,
 },
 {
 fieldKey: 'surat_ukur',
 label: 'Surat Ukur / Gambar Situasi',
 extractedValue: 'No. 342/Kebon Jeruk/2018',
 normalizedValue: 'SU-342-2018',
 confidence: 96,
 isAnomaly: false,
 },
 {
 fieldKey: 'luas_tanah',
 label: 'Luas Tanah Terdaftar',
 extractedValue: '142 m² (Seratus empat puluh dua meter persegi)',
 normalizedValue: '142',
 confidence: 97,
 isAnomaly: false,
 },
 {
 fieldKey: 'pemegang_hak',
 label: 'Nama Pemegang Hak',
 extractedValue: 'BAGUS PRASETYO',
 normalizedValue: 'BAGUS PRASETYO',
 confidence: 99,
 isAnomaly: false,
 }
 ],
 bpnSpatialVerification: {
 persilNib: '09.01.05.02.04581',
 shmNumber: 'SHM 01294',
 surfaceAreaM2: 142,
 districtOffice: 'Kantor Pertanahan Kota Administrasi Jakarta Barat',
 registeredOwner: 'Bagus Prasetyo (Sesuai KTP Pemohon)',
 applicantRelation: 'Pemilik Langsung (Self-Owned)',
 latitude: -6.195420,
 longitude: 106.772410,
 spatialMatchWithSurveyAddress: true,
 sentuhTanahkuStatus: 'Terverifikasi BPN',
 }
 },
 {
 id: 'ICR-DOC-003',
 type: 'bpn_certificate',
 title: 'Sertipikat Hak Guna Bangunan (SHGB) Ruko Usaha Penjamin',
 applicantName: 'Hendra Irawan',
 caseId: 'CASE-0946',
 scanDate: '2026-10-27 09:20 WIB',
 documentNumber: 'SHGB-3171-01-08492',
 overallConfidence: 62,
 status: 'mismatch_flag',
 thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
 summaryNote: 'PERINGATAN ANOMALI: Nama pemegang hak pada sertipikat BPN berbeda dengan data pengajuan dan NIB terdaftar di wilayah lain.',
 extractedFields: [
 {
 fieldKey: 'shm_nomor',
 label: 'Nomor Sertipikat',
 extractedValue: 'SHGB No. 08492/Gambir',
 normalizedValue: 'SHGB-08492',
 confidence: 82,
 isAnomaly: true,
 anomalyNote: 'Stempel tanda tangan pejabat BPN tampak buram & distorsi digital.',
 },
 {
 fieldKey: 'nib',
 label: 'NIB Persil ATR/BPN',
 extractedValue: '09.02.01.03.01199',
 normalizedValue: '0902010301199',
 confidence: 79,
 isAnomaly: true,
 anomalyNote: 'NIB terdaftar atas nama PT Citra Graha Abadi, bukan atas nama Hendra Irawan.',
 },
 {
 fieldKey: 'pemegang_hak',
 label: 'Nama Tertera di Fisik Dokumen',
 extractedValue: 'HENDRA IRAWAN (Hasil Edit Tempelan)',
 normalizedValue: 'MISMATCH',
 confidence: 58,
 isAnomaly: true,
 anomalyNote: 'Perbedaan ketebalan huruf pada baris pemegang hak.',
 }
 ],
 bpnSpatialVerification: {
 persilNib: '09.02.01.03.01199',
 shmNumber: 'SHGB 08492',
 surfaceAreaM2: 210,
 districtOffice: 'Kantor Pertanahan Jakarta Pusat',
 registeredOwner: 'PT Citra Graha Abadi (BEDA DENGAN PEMOHON)',
 applicantRelation: 'Tidak Teridentifikasi / Palsu',
 latitude: -6.182410,
 longitude: 106.831200,
 spatialMatchWithSurveyAddress: false,
 sentuhTanahkuStatus: 'Beda Nama Pemilik',
 }
 }
];
