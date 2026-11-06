import { VoiceVerification } from '../../types';

export const ELEVENLABS_VOICE_CONFIG = {
  modelId: 'eleven_multilingual_v2',
  agentVoice: {
    name: 'Fitri Handayani (Agent)',
    description: 'Female, professional, calm customer service tone, clear Indonesian articulation',
    recommendedPreset: 'Rachel / Sarah (Multilingual)',
    stability: 0.65,
    similarity: 0.75,
    style: 0.05,
  },
  customerVoice: {
    name: 'Ahmad Fauzi (Customer)',
    description: 'Male 35-40, everyday calm Indonesian accent, confident, no hesitation',
    recommendedPreset: 'Adam / George (Multilingual)',
    stability: 0.55,
    similarity: 0.75,
    style: 0.1,
  },
};

export const ELEVENLABS_CASE_0941_CLEAN_SCRIPT = `[Agent - Suara Wanita: Fitri]
Halo, selamat siang. Saya Fitri dari tim Verifikasi Pembiayaan BAF. Benar saya terhubung dengan Bapak Ahmad Fauzi?

[Customer - Suara Pria: Ahmad Fauzi]
Halo, selamat siang Mbak Fitri. Betul, saya sendiri, Ahmad Fauzi.

[Agent - Suara Wanita: Fitri]
Baik, terima kasih Bapak Ahmad Fauzi. Mohon izin meminta waktunya sebentar untuk melakukan verifikasi data singkat terkait pengajuan pembiayaan unit motor Yamaha melalui BAF ya, Pak.

[Customer - Suara Pria: Ahmad Fauzi]
Iya, silakan Mbak Fitri, tidak apa-apa.

[Agent - Suara Wanita: Fitri]
Baik Pak, untuk keperluan validasi identitas, bisa tolong dibantu sebutkan kembali enam belas digit Nomor Induk Kependudukan KTP Bapak?

[Customer - Suara Pria: Ahmad Fauzi]
Boleh, NIK saya: Tiga satu tujuh empat, nol satu dua nol, nol lima delapan lima, nol nol nol satu.

[Agent - Suara Wanita: Fitri]
Baik, data NIK cocok dan sesuai, Pak Ahmad. Selanjutnya, untuk pertanyaan keamanan sistem kami, mohon dibantu sebutkan nama gadis ibu kandung Bapak?

[Customer - Suara Pria: Ahmad Fauzi]
Nama ibu kandung saya Ibu Nurhasanah.

[Agent - Suara Wanita: Fitri]
Baik, Ibu Nurhasanah. Lalu untuk tanggal lahir Bapak sendiri tanggal berapa ya, Pak?

[Customer - Suara Pria: Ahmad Fauzi]
Tanggal dua puluh Mei, tahun seribu sembilan ratus delapan puluh lima.

[Agent - Suara Wanita: Fitri]
Cocok, terima kasih Pak. Selanjutnya mengenai detail pembiayaan. Pengajuan Bapak adalah satu unit Yamaha N-MAX seratus lima puluh lima Connected, dengan masa tenor tiga puluh lima bulan. Apakah sudah betul, Pak?

[Customer - Suara Pria: Ahmad Fauzi]
Iya betul Mbak, Yamaha N-MAX seratus lima puluh lima Connected, tenornya tiga puluh lima bulan.

[Agent - Suara Wanita: Fitri]
Baik. Untuk uang muka yang disepakati adalah lima juta lima ratus ribu rupiah, dengan nilai angsuran per bulan sebesar satu juta tiga ratus sembilan puluh lima ribu rupiah. Apakah Bapak menyetujui nominal angsuran tersebut?

[Customer - Suara Pria: Ahmad Fauzi]
Iya Mbak Fitri, saya setuju. Angsurannya satu juta tiga ratus sembilan puluh lima ribu rupiah per bulan. Sudah sesuai simulasi kemarin.

[Agent - Suara Wanita: Fitri]
Sempurna. Sebagai penutup, kami informasikan bahwa percakapan telepon ini direkam secara resmi sebagai bukti verifikasi yang sah sesuai regulasi Otoritas Jasa Keuangan dan kebijakan pembiayaan PT Bussan Auto Finance. Apakah Bapak Ahmad Fauzi menyetujui hal tersebut?

[Customer - Suara Pria: Ahmad Fauzi]
Baik Mbak, saya memahami dan menyetujui sepenuhnya.

[Agent - Suara Wanita: Fitri]
Terima kasih banyak atas waktu dan kerja sama Bapak Ahmad Fauzi. Proses verifikasi telah selesai dan data Bapak akan segera kami teruskan ke sistem. Selamat siang dan selamat beraktivitas kembali.

[Customer - Suara Pria: Ahmad Fauzi]
Sama-sama Mbak Fitri, selamat siang.`;

export const case0941CleanVoiceVerification: VoiceVerification = {
  callId: 'CALL-20261027-0941-CLN',
  callDuration: 150,
  agentName: 'Fitri Handayani',
  agentId: 'AGT-044',
  callTimestamp: '2026-10-27 14:18:10',
  audioDurationFormatted: '02:30',
  overallHesitancyCount: 0,
  spellingAccuracyScore: 100,
  scriptComplianceScore: 100,
  score: 18,
  voiceFlags: [],
  complianceChecklist: [
    {
      id: 'SC-1',
      category: 'Pembuka',
      requirement: 'Salam standar BAF & perkenalan diri verifikator',
      isCompliant: true,
      timestampRef: 4,
      note: 'Salam standar BAF dan perkenalan identitas verifikator lengkap',
    },
    {
      id: 'SC-2',
      category: 'Verifikasi',
      requirement: 'Konfirmasi nama lengkap & 16 digit NIK pemohon',
      isCompliant: true,
      timestampRef: 24,
      note: '16 digit NIK diverifikasi akurat tanpa kesalahan sebut',
    },
    {
      id: 'SC-3',
      category: 'Verifikasi',
      requirement: 'Verifikasi nama gadis ibu kandung nasabah',
      isCompliant: true,
      timestampRef: 42,
      note: 'Nama gadis ibu kandung dan tanggal lahir dijawab lancar (<1 detik respons)',
    },
    {
      id: 'SC-4',
      category: 'Pembiayaan',
      requirement: 'Konfirmasi unit Yamaha NMAX 155 & tenor 35 bulan',
      isCompliant: true,
      timestampRef: 68,
      note: 'Unit dan tenor terkonfirmasi sesuai pengajuan',
    },
    {
      id: 'SC-5',
      category: 'Pembiayaan',
      requirement: 'Konfirmasi besaran angsuran & tanggal jatuh tempo',
      isCompliant: true,
      timestampRef: 98,
      note: 'Nominal angsuran Rp 1.395.000 disetujui pemohon',
    },
    {
      id: 'SC-6',
      category: 'Penutup',
      requirement: 'Pernyataan klausul persetujuan & rekaman resmi OJK',
      isCompliant: true,
      timestampRef: 124,
      note: 'Klausul rekaman resmi OJK dibacakan dan disetujui pemohon',
    },
  ],
  transcripts: [
    {
      id: 'CLN-1',
      speaker: 'agent',
      startTime: 0,
      endTime: 6,
      text: 'Halo, selamat siang. Saya Fitri dari tim Verifikasi Pembiayaan BAF. Benar saya terhubung dengan Bapak Ahmad Fauzi?',
    },
    {
      id: 'CLN-2',
      speaker: 'customer',
      startTime: 7,
      endTime: 11,
      text: 'Halo, selamat siang Mbak Fitri. Betul, saya sendiri, Ahmad Fauzi.',
    },
    {
      id: 'CLN-3',
      speaker: 'agent',
      startTime: 12,
      endTime: 21,
      text: 'Baik, terima kasih Bapak Ahmad Fauzi. Mohon izin meminta waktunya sebentar untuk melakukan verifikasi data singkat terkait pengajuan pembiayaan unit motor Yamaha melalui BAF ya, Pak.',
    },
    {
      id: 'CLN-4',
      speaker: 'customer',
      startTime: 22,
      endTime: 25,
      text: 'Iya, silakan Mbak Fitri, tidak apa-apa.',
    },
    {
      id: 'CLN-5',
      speaker: 'agent',
      startTime: 26,
      endTime: 34,
      text: 'Baik Pak, untuk keperluan validasi identitas, bisa tolong dibantu sebutkan kembali enam belas digit Nomor Induk Kependudukan KTP Bapak?',
    },
    {
      id: 'CLN-6',
      speaker: 'customer',
      startTime: 35,
      endTime: 48,
      text: 'Boleh, NIK saya: Tiga satu tujuh empat, nol satu dua nol, nol lima delapan lima, nol nol nol satu.',
      spellingMatch: true,
    },
    {
      id: 'CLN-7',
      speaker: 'agent',
      startTime: 49,
      endTime: 56,
      text: 'Baik, data NIK cocok dan sesuai, Pak Ahmad. Selanjutnya, untuk pertanyaan keamanan sistem kami, mohon dibantu sebutkan nama gadis ibu kandung Bapak?',
    },
    {
      id: 'CLN-8',
      speaker: 'customer',
      startTime: 57,
      endTime: 62,
      text: 'Nama ibu kandung saya Ibu Nurhasanah.',
    },
    {
      id: 'CLN-9',
      speaker: 'agent',
      startTime: 63,
      endTime: 70,
      text: 'Baik, Ibu Nurhasanah. Lalu untuk tanggal lahir Bapak sendiri tanggal berapa ya, Pak?',
    },
    {
      id: 'CLN-10',
      speaker: 'customer',
      startTime: 71,
      endTime: 79,
      text: 'Tanggal dua puluh Mei, tahun seribu sembilan ratus delapan puluh lima.',
    },
    {
      id: 'CLN-11',
      speaker: 'agent',
      startTime: 80,
      endTime: 92,
      text: 'Cocok, terima kasih Pak. Selanjutnya mengenai detail pembiayaan. Pengajuan Bapak adalah satu unit Yamaha N-MAX seratus lima puluh lima Connected, dengan masa tenor tiga puluh lima bulan. Apakah sudah betul, Pak?',
    },
    {
      id: 'CLN-12',
      speaker: 'customer',
      startTime: 93,
      endTime: 101,
      text: 'Iya betul Mbak, Yamaha N-MAX seratus lima puluh lima Connected, tenornya tiga puluh lima bulan.',
    },
    {
      id: 'CLN-13',
      speaker: 'agent',
      startTime: 102,
      endTime: 115,
      text: 'Baik. Untuk uang muka yang disepakati adalah lima juta lima ratus ribu rupiah, dengan nilai angsuran per bulan sebesar satu juta tiga ratus sembilan puluh lima ribu rupiah. Apakah Bapak menyetujui nominal angsuran tersebut?',
    },
    {
      id: 'CLN-14',
      speaker: 'customer',
      startTime: 116,
      endTime: 126,
      text: 'Iya Mbak Fitri, saya setuju. Angsurannya satu juta tiga ratus sembilan puluh lima ribu rupiah per bulan. Sudah sesuai simulasi kemarin.',
    },
    {
      id: 'CLN-15',
      speaker: 'agent',
      startTime: 127,
      endTime: 141,
      text: 'Sempurna. Sebagai penutup, kami informasikan bahwa percakapan telepon ini direkam secara resmi sebagai bukti verifikasi yang sah sesuai regulasi Otoritas Jasa Keuangan dan kebijakan pembiayaan PT Bussan Auto Finance. Apakah Bapak Ahmad Fauzi menyetujui hal tersebut?',
    },
    {
      id: 'CLN-16',
      speaker: 'customer',
      startTime: 142,
      endTime: 147,
      text: 'Baik Mbak, saya memahami dan menyetujui sepenuhnya.',
    },
    {
      id: 'CLN-17',
      speaker: 'agent',
      startTime: 148,
      endTime: 156,
      text: 'Terima kasih banyak atas waktu dan kerja sama Bapak Ahmad Fauzi. Proses verifikasi telah selesai dan data Bapak akan segera kami teruskan ke sistem. Selamat siang dan selamat beraktivitas kembali.',
    },
    {
      id: 'CLN-18',
      speaker: 'customer',
      startTime: 157,
      endTime: 161,
      text: 'Sama-sama Mbak Fitri, selamat siang.',
    },
  ],
};
