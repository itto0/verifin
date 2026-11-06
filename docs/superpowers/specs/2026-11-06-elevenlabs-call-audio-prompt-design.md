# Design Spec: ElevenLabs Call Audio Conversation Prompt (VeriFin Clean Tele-Verification)

- **Date:** 2026-11-06
- **Status:** Approved
- **Topic:** Audio Call Conversation Prompt for ElevenLabs TTS / Multi-Speaker Studio
- **Target Use Case:** VeriFin BAF Tele-Verification Demo Audio Asset (Clean / Auto-Approval Scenario)

---

## 1. Overview & Context

Aplikasi VeriFin untuk BAF (Bussan Auto Finance) memiliki modul verifikasi suara (*Tele-verification Voice Audit*) yang menganalisis rekaman telepon antara Verifikator (Agent) dan Pemohon Pembiayaan (Nasabah). Analisis tersebut mencakup ASR multi-speaker Bahasa Indonesia, deteksi keraguan (*acoustic hesitancy*), validasi ejaan identitas (*spelling accuracy*), kepatuhan skrip OJK (*script compliance*), dan deteksi intervensi pihak ketiga (*third-party whisper / calo*).

Spesifikasi ini mendefinisikan naskah dialog percakapan telepon dan panduan konfigurasi ElevenLabs untuk menghasilkan file audio berkualitas tinggi (*clean / lolos otomatis*) yang selaras dengan data kasus **CASE-0941 (Ahmad Fauzi)** di VeriFin.

---

## 2. Voice Casting & ElevenLabs Configuration

### 2.1 Speaker Roles & Profiles

| Atribut | Speaker 1: Agent Verifikator | Speaker 2: Nasabah / Debitur |
|---|---|---|
| **Identitas Karakter** | Fitri Handayani (Agent ID: `AGT-044`) | Ahmad Fauzi (Pemohon Pembiayaan) |
| **Profil Vokal** | Wanita usia 25–30, nada formal-ramah, tempo teratur, intonasi standar SOP perbankan/multifinance | Pria usia 35–40, nada tenang, artikulasi jelas, percaya diri, tanpa keraguan |
| **Model ElevenLabs** | Eleven Multilingual v2 | Eleven Multilingual v2 |
| **Voice Persona Rekomendasi** | Voice wanita profesional Indonesia (e.g. Rachel, Sarah, atau custom clone wanita CS) | Voice pria bersahaja Indonesia (e.g. Adam, George, atau custom clone pria santai) |
| **Stability** | `0.65` (tinggi untuk menjaga konsistensi intonasi SOP) | `0.55` (sedang untuk variasi natural sehari-hari) |
| **Clarity + Similarity** | `0.75` | `0.75` |
| **Style Exaggeration** | `0.05` | `0.10` |

### 2.2 Alignment Data Kasus (CASE-0941)

Semua entitas data dalam percakapan harus identik dengan data di `src/data/mockData.ts`:
- **ID Aplikasi:** BAF-APP-2026-0941
- **Nama Lengkap:** Ahmad Fauzi
- **NIK:** `3174012005850001`
- **Tanggal Lahir:** 20 Mei 1985
- **Nama Gadis Ibu Kandung:** Nurhasanah
- **Unit Kendaraan:** Yamaha NMAX 155 Connected
- **Masa Tenor:** 35 Bulan
- **Uang Muka (DP):** Rp 5.500.000
- **Angsuran Bulanan:** Rp 1.395.000
- **Hasil Audit VeriFin yang Diharapkan:**
  - Hesitancy count: 0 (tidak ada jeda > 2.0 detik)
  - Spelling match: 100%
  - Script compliance score: 100% (6 dari 6 item terpenuhi)
  - Risk pillar voice score: Rendah (zona hijau / auto-approval)

---

## 3. OJK Script Compliance Checklist Alignment

Naskah dirancang untuk secara eksplisit memenuhi seluruh checklist kepatuhan regulasi OJK & standar operasional BAF:

| ID Checklist | Kategori | Butir Kepatuhan | Implementasi dalam Dialog |
|---|---|---|---|
| **SC-1** | Pembuka | Salam standar BAF & perkenalan diri verifikator | Agent menyapa, memperkenalkan diri dari BAF, dan mengonfirmasi identitas penerima telepon. |
| **SC-2** | Verifikasi | Konfirmasi nama lengkap & 16 digit NIK | Nasabah melafalkan 16 digit NIK secara ritmis (pola 4-4-4-4). |
| **SC-3** | Verifikasi | Verifikasi nama gadis ibu kandung & tanggal lahir | Pertanyaan keamanan dijawab langsung dan lugas (<1 detik respons) tanpa ragu. |
| **SC-4** | Pembiayaan | Konfirmasi unit Yamaha NMAX 155 & tenor 35 bulan | Agent mengonfirmasi unit dan durasi tenor; nasabah mengonfirmasi kesesuaian. |
| **SC-5** | Pembiayaan | Konfirmasi besaran angsuran & persetujuan nasabah | Angsuran Rp 1.395.000 disebutkan dengan benar dan disetujui tanpa koreksi. |
| **SC-6** | Penutup | Klausul persetujuan rekaman resmi OJK | Pembacaan klausul rekaman resmi sesuai regulasi OJK dan persetujuan nasabah. |

---

## 4. Production Script (Multi-Speaker Dialogue)

Naskah diformat dengan ejaan fonetik bahasa Indonesia agar pelafalan angka, singkatan motor, dan nama tetap konsisten saat diproses oleh text-to-speech.

```text
[Agent - Suara Wanita: Fitri]
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
Sama-sama Mbak Fitri, selamat siang.
```

---

## 5. Audio Post-Processing & Integration Guide

1. **Format Ekspor ElevenLabs:**
   - Rekomendasi: `MP3` (44.1 kHz, 128 kbps atau 192 kbps) atau `WAV`.
2. **Efek Akustik Telepon (Opsional):**
   - Jika ingin terdengar autentik seperti panggilan telepon seluler, terapkan filter *Bandpass* (High-pass di 300 Hz dan Low-pass di 3.400 Hz) menggunakan DAW atau web editor gratis sebelum diunggah.
3. **Pengujian di VeriFin:**
   - Buka tab *Tele-verification* pada detail kasus `CASE-0941`.
   - Gunakan fitur *Upload Custom Audio* untuk menguji pengenalan audio AI, ekstraksi waveform Web Audio API, dan sinkronisasi transkrip multi-speaker.
