import {
  MasterBranch,
  MasterProduct,
  MasterSurveyor,
  MasterScriptItem,
  MasterDocumentRule
} from '../types';

export const mockMasterBranches: MasterBranch[] = [
  {
    id: 'BR-01',
    code: 'BAF-JKT01',
    name: 'BAF Cabang Jakarta Selatan',
    region: 'Jabodetabek 1',
    address: 'Jl. TB Simatupang No. 18, Cilandak, Jakarta Selatan',
    manager: 'Bambang Soedirman, S.E.',
    activeSurveyors: 8,
    maxRadiusMeters: 1000,
    latitude: -6.2925,
    longitude: 106.8042,
    status: 'active'
  },
  {
    id: 'BR-02',
    code: 'BAF-JKT02',
    name: 'BAF Cabang Jakarta Timur',
    region: 'Jabodetabek 1',
    address: 'Jl. Raya Pemuda Kav. 72, Rawamangun, Jakarta Timur',
    manager: 'Sri Wahyuningsih, M.M.',
    activeSurveyors: 6,
    maxRadiusMeters: 1200,
    latitude: -6.1952,
    longitude: 106.8821,
    status: 'active'
  },
  {
    id: 'BR-03',
    code: 'BAF-BKS01',
    name: 'BAF Cabang Bekasi Barat',
    region: 'Jawa Barat 1',
    address: 'Ruko Sinpasa Commercial Blok A-12, Summarecon Bekasi',
    manager: 'Hendra Gunawan',
    activeSurveyors: 7,
    maxRadiusMeters: 1500,
    latitude: -6.2238,
    longitude: 106.9984,
    status: 'active'
  },
  {
    id: 'BR-04',
    code: 'BAF-BDG01',
    name: 'BAF Cabang Bandung Asia Afrika',
    region: 'Jawa Barat 2',
    address: 'Jl. Asia Afrika No. 141, Sumur Bandung, Kota Bandung',
    manager: 'Ahmad Fauzi Ridwan',
    activeSurveyors: 9,
    maxRadiusMeters: 1000,
    latitude: -6.9219,
    longitude: 107.6111,
    status: 'active'
  },
  {
    id: 'BR-05',
    code: 'BAF-SBY01',
    name: 'BAF Cabang Surabaya Gubeng',
    region: 'Jawa Timur 1',
    address: 'Jl. Raya Gubeng No. 44, Gubeng, Surabaya',
    manager: 'Didik Prasetyo',
    activeSurveyors: 8,
    maxRadiusMeters: 1200,
    latitude: -7.2754,
    longitude: 112.7533,
    status: 'active'
  },
  {
    id: 'BR-06',
    code: 'BAF-SMG01',
    name: 'BAF Cabang Semarang Pandanaran',
    region: 'Jawa Tengah',
    address: 'Jl. Pandanaran No. 58, Semarang Tengah, Semarang',
    manager: 'Rini Astuti',
    activeSurveyors: 5,
    maxRadiusMeters: 1000,
    latitude: -6.9881,
    longitude: 110.4194,
    status: 'active'
  },
  {
    id: 'BR-07',
    code: 'BAF-DPS01',
    name: 'BAF Cabang Denpasar Teuku Umar',
    region: 'Bali & Nusa Tenggara',
    address: 'Jl. Teuku Umar No. 108, Denpasar Barat, Denpasar',
    manager: 'I Wayan Suweta',
    activeSurveyors: 4,
    maxRadiusMeters: 1000,
    latitude: -8.6742,
    longitude: 115.2065,
    status: 'active'
  },
  {
    id: 'BR-08',
    code: 'BAF-MDN01',
    name: 'BAF Cabang Medan Ringroad',
    region: 'Sumatera Utara',
    address: 'Jl. Ring Road / Gagak Hitam No. 88, Medan Sunggal',
    manager: 'Taufik Hidayat Siregar',
    activeSurveyors: 6,
    maxRadiusMeters: 1500,
    latitude: 3.5786,
    longitude: 98.6321,
    status: 'active'
  }
];

export const mockMasterProducts: MasterProduct[] = [
  {
    id: 'PROD-01',
    code: 'YMH-NMAX-155',
    category: 'Motor Baru',
    brand: 'Yamaha',
    modelName: 'All New NMAX 155 Connected/ABS',
    engineCc: 155,
    otrPrice: 36750000,
    minDownPaymentPercent: 15,
    maxTenorMonths: 35,
    annualInterestRate: 19.8,
    status: 'active'
  },
  {
    id: 'PROD-02',
    code: 'YMH-AEROX-155',
    category: 'Motor Baru',
    brand: 'Yamaha',
    modelName: 'All New Aerox 155 Connected CyberCity',
    engineCc: 155,
    otrPrice: 31560000,
    minDownPaymentPercent: 15,
    maxTenorMonths: 35,
    annualInterestRate: 19.8,
    status: 'active'
  },
  {
    id: 'PROD-03',
    code: 'YMH-GFIL-125',
    category: 'Motor Baru',
    brand: 'Yamaha',
    modelName: 'Grand Filano Hybrid-Connected Lux',
    engineCc: 125,
    otrPrice: 28200000,
    minDownPaymentPercent: 10,
    maxTenorMonths: 35,
    annualInterestRate: 18.5,
    status: 'active'
  },
  {
    id: 'PROD-04',
    code: 'YMH-FAZZ-125',
    category: 'Motor Baru',
    brand: 'Yamaha',
    modelName: 'Fazzio Hybrid Neo',
    engineCc: 125,
    otrPrice: 23350000,
    minDownPaymentPercent: 10,
    maxTenorMonths: 35,
    annualInterestRate: 18.5,
    status: 'active'
  },
  {
    id: 'PROD-05',
    code: 'YMH-XMAX-250',
    category: 'Motor Baru',
    brand: 'Yamaha',
    modelName: 'XMAX 250 Connected Maxi Series',
    engineCc: 250,
    otrPrice: 66900000,
    minDownPaymentPercent: 20,
    maxTenorMonths: 35,
    annualInterestRate: 16.5,
    status: 'active'
  },
  {
    id: 'PROD-06',
    code: 'YMH-MIO-125',
    category: 'Motor Baru',
    brand: 'Yamaha',
    modelName: 'Mio M3 125 Standard',
    engineCc: 125,
    otrPrice: 18150000,
    minDownPaymentPercent: 10,
    maxTenorMonths: 35,
    annualInterestRate: 20.0,
    status: 'active'
  },
  {
    id: 'PROD-07',
    code: 'BAF-DANA-SYR',
    category: 'Dana Syariah',
    brand: 'BAF Dana',
    modelName: 'Pembiayaan Dana Syariah BAF (Agunan BPKB)',
    engineCc: 0,
    otrPrice: 50000000,
    minDownPaymentPercent: 0,
    maxTenorMonths: 36,
    annualInterestRate: 14.5,
    status: 'active'
  }
];

export const mockMasterSurveyors: MasterSurveyor[] = [
  {
    id: 'SRV-01',
    employeeNik: 'CMO-2022091',
    fullName: 'Bayu Nugroho',
    branchCode: 'BAF-JKT01',
    branchName: 'BAF Jakarta Selatan',
    phone: '0813-8821-4901',
    deviceModel: 'Samsung Galaxy A15 (SM-A155F)',
    deviceImei: '862049102847192',
    osVersion: 'Android 14 (OneUI 6.1)',
    gpsAccuracyThresholdMeters: 15,
    mockLocationStrikes: 2,
    status: 'suspended',
    lastActive: '2026-10-27 15:10 WIB'
  },
  {
    id: 'SRV-02',
    employeeNik: 'CMO-2021045',
    fullName: 'Fajar Ramadhan',
    branchCode: 'BAF-BDG01',
    branchName: 'BAF Bandung Asia Afrika',
    phone: '0812-9901-2334',
    deviceModel: 'Xiaomi Redmi Note 13',
    deviceImei: '863920194827104',
    osVersion: 'Android 13 (HyperOS)',
    gpsAccuracyThresholdMeters: 10,
    mockLocationStrikes: 0,
    status: 'active',
    lastActive: '2026-10-27 16:40 WIB'
  },
  {
    id: 'SRV-03',
    employeeNik: 'CMO-2023118',
    fullName: 'Eko Prasetyo',
    branchCode: 'BAF-SBY01',
    branchName: 'BAF Surabaya Gubeng',
    phone: '0857-1192-3840',
    deviceModel: 'Infinix Note 40 Pro',
    deviceImei: '869201847192841',
    osVersion: 'Android 14 (XOS 14)',
    gpsAccuracyThresholdMeters: 12,
    mockLocationStrikes: 0,
    status: 'active',
    lastActive: '2026-10-27 14:22 WIB'
  },
  {
    id: 'SRV-04',
    employeeNik: 'CMO-2020088',
    fullName: 'Rizky Kurniawan',
    branchCode: 'BAF-JKT02',
    branchName: 'BAF Jakarta Timur',
    phone: '0811-9283-4911',
    deviceModel: 'Oppo Reno 11F 5G',
    deviceImei: '861928471092834',
    osVersion: 'Android 14 (ColorOS 14)',
    gpsAccuracyThresholdMeters: 10,
    mockLocationStrikes: 1,
    status: 'active',
    lastActive: '2026-10-27 13:50 WIB'
  },
  {
    id: 'SRV-05',
    employeeNik: 'CMO-2024012',
    fullName: 'Agus Setiawan',
    branchCode: 'BAF-BKS01',
    branchName: 'BAF Bekasi Barat',
    phone: '0818-0923-4819',
    deviceModel: 'Vivo Y27s',
    deviceImei: '864910294819284',
    osVersion: 'Android 13 (Funtouch 13)',
    gpsAccuracyThresholdMeters: 15,
    mockLocationStrikes: 0,
    status: 'active',
    lastActive: '2026-10-27 16:05 WIB'
  }
];

export const mockMasterScriptItems: MasterScriptItem[] = [
  {
    id: 'SCR-01',
    sequence: 1,
    category: 'Pembukaan & Identifikasi Petugas',
    questionText: 'Selamat pagi/siang, dengan Bpk/Ibu [Nama Konsumen]? Saya [Nama Agent] dari PT Bussan Auto Finance (BAF). Pembicaraan ini kami rekam untuk standar kualitas dan keamanan transaksi.',
    isMandatory: true,
    weightPercent: 15,
    expectedKeywords: ['Bussan Auto Finance', 'BAF', 'rekam', 'kualitas', 'keamanan'],
    complianceNotes: 'Wajib menyebutkan nama PT BAF dan pengumuman perekaman suara sesuai regulasi OJK.'
  },
  {
    id: 'SCR-02',
    sequence: 2,
    category: 'Verifikasi Identitas NIK & TTL',
    questionText: 'Mohon dapat dikonfirmasi kembali 16 digit NIK e-KTP dan tempat tanggal lahir Bpk/Ibu pemohon?',
    isMandatory: true,
    weightPercent: 25,
    expectedKeywords: ['NIK', 'tanggal lahir', 'bulan', 'tahun'],
    complianceNotes: 'Data diucapkan langsung oleh pemohon, dilarang dipandu atau dibisikkan oleh pihak ketiga.'
  },
  {
    id: 'SCR-03',
    sequence: 3,
    category: 'Verifikasi Alamat Domisili & Kepemilikan',
    questionText: 'Bisa disebutkan alamat lengkap tempat tinggal saat ini beserta status kepemilikan rumah (milik sendiri, keluarga, atau sewa/kontrak)?',
    isMandatory: true,
    weightPercent: 20,
    expectedKeywords: ['alamat', 'RT', 'RW', 'kelurahan', 'milik sendiri', 'kontrak'],
    complianceNotes: 'Dicocokkan dengan hasil foto geotag survei lapangan CMO.'
  },
  {
    id: 'SCR-04',
    sequence: 4,
    category: 'Verifikasi Unit & Struktur Pembiayaan',
    questionText: 'Pengajuan pembiayaan untuk unit [Model Kendaraan] dengan uang muka Rp [Nominal DP] dan angsuran Rp [Nominal Cicilan] per bulan selama [Tenor] bulan. Apakah sudah sesuai kesepakatan?',
    isMandatory: true,
    weightPercent: 20,
    expectedKeywords: ['Yamaha', 'uang muka', 'DP', 'angsuran', 'tenor', 'bulan'],
    complianceNotes: 'Memastikan pemohon memahami beban angsuran per bulan dan tenor yang disepakati.'
  },
  {
    id: 'SCR-05',
    sequence: 5,
    category: 'Pernyataan Anti-Fraud & Penutup',
    questionText: 'Apakah unit kendaraan ini dipergunakan sendiri dan bukan atas nama orang lain / pengalihan unit? Kami ingatkan bahwa unit dilarang dipindahtangankan tanpa persetujuan tertulis dari BAF.',
    isMandatory: true,
    weightPercent: 20,
    expectedKeywords: ['sendiri', 'bukan atas nama', 'tidak dialihkan', 'fidusia'],
    complianceNotes: 'Wajib memberikan edukasi UU Jaminan Fidusia dan klausul anti joki kredit.'
  }
];

export const mockMasterDocumentRules: MasterDocumentRule[] = [
  {
    id: 'DOCR-01',
    documentType: 'e-KTP Pemohon Asli',
    applicableProduct: 'Semua Produk Pembiayaan',
    isMandatory: true,
    minOcrConfidence: 90,
    minBiometricMatch: 80,
    autoRejectOnTamper: true,
    description: 'Foto fisik asli e-KTP, bukan fotokopi/scan layar. NIK 16 digit wajib valid dan lulus uji algoritma Dukcapil.'
  },
  {
    id: 'DOCR-02',
    documentType: 'Kartu Keluarga (KK)',
    applicableProduct: 'Semua Produk Pembiayaan',
    isMandatory: true,
    minOcrConfidence: 85,
    minBiometricMatch: 0,
    autoRejectOnTamper: false,
    description: 'Verifikasi susunan keluarga, kesesuaian nama kepala keluarga, dan kesesuaian alamat domisili.'
  },
  {
    id: 'DOCR-03',
    documentType: 'Slip Gaji / Bukti Penghasilan / Rekening Koran',
    applicableProduct: 'Pembiayaan > Rp 25.000.000',
    isMandatory: true,
    minOcrConfidence: 85,
    minBiometricMatch: 0,
    autoRejectOnTamper: true,
    description: 'Bukti penghasilan 3 bulan terakhir. DSR (Debt Service Ratio) angsuran maksimal 35% dari net salary.'
  },
  {
    id: 'DOCR-04',
    documentType: 'Foto Rumah & Bukti Kunjungan Lapangan',
    applicableProduct: 'Semua Produk Pembiayaan Lapangan',
    isMandatory: true,
    minOcrConfidence: 0,
    minBiometricMatch: 0,
    autoRejectOnTamper: true,
    description: 'Wajib diambil melalui kamera in-app Android dengan koordinat GPS real-time. Radius maksimal 1.000 meter.'
  },
  {
    id: 'DOCR-05',
    documentType: 'Sertipikat Tanah / PBB (Sentuh Tanahku)',
    applicableProduct: 'Dana Syariah Agunan Properti',
    isMandatory: false,
    minOcrConfidence: 85,
    minBiometricMatch: 0,
    autoRejectOnTamper: true,
    description: 'Verifikasi NIB dan plotting bidang batas tanah via integrasi spasial Sentuh Tanahku ATR/BPN.'
  }
];
