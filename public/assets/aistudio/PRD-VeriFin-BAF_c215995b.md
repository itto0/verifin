# VeriFin untuk BAF: PRD & Arsitektur (Draft v0.3)
Disusun oleh System Analyst. **[Asumsi]** perlu dikonfirmasi ke BAF. Credit analyst di luar scope.

## 1. Masalah & Tujuan
Pengajuan pembiayaan BAF bervolume besar dan tersebar di banyak cabang; verifikasi dokumen, survei, dan telepon masih manual sehingga lambat dan rawan fraud. VeriFin memeriksa **data, lokasi, komunikasi** secara otomatis dan memberi **skor risiko + flag** per pengajuan untuk ditinjau manusia.
Sasaran demo: alur end-to-end (Skenario A) 10-15 menit dengan data dummy.

## 2. Persona
Sales (mobile, input cepat) · Surveyor (mobile, bukti kunjungan) · Verifikator (web, putuskan flag) · QA Officer (web, call bermasalah) · Supervisor (web, peta) · Admin (web, aturan).

## 3. Scope
**Demo:** UC-01 scan+auto-fill, UC-02 e-KTP, UC-04 survei geotag, UC-05 peta, UC-06 tele-verifikasi, UC-07 QA call, UC-09 review flag.
**Nanti:** ICR, QA collection/CS, heatmap, integrasi LOS penuh, credit analyst, agunan properti.

## 4. Kebutuhan Fungsional
| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Capture dokumen dengan panduan bingkai, cek blur/silau/terpotong | Must |
| FR-02 | OCR KTP/KK/NPWP/slip/STNK/BPKB/faktur, auto-fill, confidence per field (<90% kuning) | Must |
| FR-03 | Validasi struktur NIK | Must |
| FR-04 | Deteksi manipulasi KTP (edit, foto layar, fotokopi, tempelan) | Must |
| FR-05 | Foto survei hanya dari kamera app; GPS+waktu otomatis | Must |
| FR-06 | Deteksi mock location | Must |
| FR-07 | Jarak ke alamat; radius >200 m kuning, >1 km merah (dapat diatur) | Must |
| FR-08 | Peta survei hijau/kuning/merah + rute surveyor | Must |
| FR-09 | ASR Bahasa Indonesia, pisah agent/konsumen | Must |
| FR-10 | Intonasi agent, keraguan konsumen, spelling (nama/NIK/alamat/nominal), kepatuhan script | Must |
| FR-11 | Player rekaman + transkrip + highlight ber-timestamp | Must |
| FR-12 | Skor 0-100 + flag + alasan; antrian review satu layar | Must |
| FR-13 | Keputusan manual (setujui/survei ulang/fraud) + catatan | Must |
| FR-14 | Pengaturan aturan, audit trail, laporan, API LOS | Should |

## 5. Skor Risiko (usulan, dapat diatur)
Jumlah berbobot: e-KTP 30, Lokasi 30, Suara 25, Dokumen 15. Flag: 0-39 hijau, 40-69 kuning, 70-100 merah. Tiap flag wajib punya alasan terbaca. Intonasi/keraguan = **indikator, bukan bukti fraud**.

## 6. Arsitektur
- **Klien:** Android (kamera in-app, GPS, offline+sinkron); Web React.
- **Layanan:** API Gateway+Auth (RBAC, masking NIK) · Case Service · Document Service (OCR/ICR) · e-KTP Service (Dukcapil **[Asumsi]** bila ada akses) · Geo Service (PostGIS) · Voice Service (ASR, diarization, intonasi, spelling, script) · Risk Engine · adapter LOS & telepon.
- **Data:** PostgreSQL+PostGIS, object storage terenkripsi, message queue untuk job AI asinkron, Redis.
- **Alur A:** scan dokumen -> Document+e-KTP -> Case; foto survei -> Geo; rekaman -> Voice; semua -> Risk Engine -> antrian Verifikator.

## 7. Tech Stack
Usulan awal. Pilihan model AI adalah kandidat yang di-benchmark pada data BAF di fase pilot, bukan janji akurasi.

| Lapisan | Pilihan | Catatan |
|---|---|---|
| Web | React 18, Vite 5, TypeScript, Tailwind v4, shadcn/ui (Radix), TanStack Query, React Router | Sama dengan demo |
| Peta (GIS) | MapLibre GL JS, tile OSM self-hosted | Tidak bergantung vendor peta |
| Audio & grafik | wavesurfer.js (player), Recharts (laporan) | |
| Mobile | Kotlin, Jetpack Compose, CameraX, Fused Location, Room, WorkManager | Native untuk kontrol kamera dan deteksi mock location; offline + sinkron |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy, Celery | REST + OpenAPI; job AI asinkron |
| Database | PostgreSQL 16 + PostGIS, Redis | PostGIS untuk jarak, radius, geofence |
| Antrian | RabbitMQ | Job OCR, ASR, analisis suara |
| Object storage | MinIO / S3-compatible, enkripsi at-rest | Lokasi data di Indonesia |
| Auth | Keycloak (OIDC), RBAC per peran | Masking NIK per peran |
| OCR / ICR | PaddleOCR + ekstraksi field (KTP, KK, slip, dst), TrOCR untuk tulisan tangan | Fine-tune pada dokumen Indonesia |
| e-KTP | Validator NIK (aturan), CNN deteksi manipulasi, InsightFace (face match) | Dukcapil **[Asumsi]** bila ada akses resmi |
| Voice | faster-whisper (Bahasa Indonesia), pyannote (diarization), librosa/openSMILE (prosodi), rapidfuzz (spelling) | Intonasi = indikator |
| Model serving | ONNX Runtime / Triton, GPU sesuai volume | |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki | |
| Infra | Docker, Kubernetes (PoC: Docker Compose), CI/CD GitHub Actions atau GitLab CI | Cloud atau on-premise, menunggu keputusan BAF |

## 8. Struktur Proyek
Monorepo. Folder `apps/web` sama dengan project demo yang sudah ada.

```
verifin/
  apps/
    web/                    # React + Vite + shadcn (dashboard)
      src/
        components/ui/      # button, badge, dst (shadcn)
        features/           # queue, case-detail, gis-map, qa-call, settings
        lib/                # utils, api client
        data.ts             # data dummy (demo)
        App.tsx, main.tsx, index.css
    mobile-android/         # Kotlin + Compose
      app/src/main/
        capture/            # kamera in-app, cek kualitas gambar
        survey/             # geotag, mock location, jarak
        sync/               # Room + WorkManager
  services/
    gateway/                # auth, RBAC, rate limit
    case/                   # pengajuan, status, keputusan, audit
    document/               # OCR/ICR, cross-check
    ektp/                   # NIK, manipulasi, duplikasi
    geo/                    # jarak, radius, geofence (PostGIS)
    voice/                  # ASR, intonasi, spelling, script
    risk/                   # skor gabungan + alasan
    integrations/           # adapter LOS dan sistem telepon
  packages/
    api-contracts/          # OpenAPI + tipe TypeScript/Kotlin hasil generate
  infra/
    docker/                 # Dockerfile, compose
    k8s/                    # manifest/helm
    ci/                     # pipeline
  data/demo/                # KTP fiktif, foto survei, rekaman, titik peta
  docs/                     # PRD, arsitektur, ADR
```

Aturan: tiap service punya `app/`, `tests/`, `Dockerfile`, dan skema DB sendiri (migrasi Alembic). Komunikasi antar service lewat API/antrian, bukan akses DB langsung.

## 9. Non-Fungsional
Enkripsi transit/at-rest, RBAC, data di Indonesia, UU PDP & OJK, opsi on-premise. Target: OCR <5 dtk/dokumen, transkrip call 5 menit <2 menit (diuji di pilot). Audit trail penuh. Tidak menjanjikan akurasi sebelum uji data BAF; selalu ada confidence + review manual.

## 10. Data Demo
KTP fiktif 2 (asli+diedit), dokumen 1-2, foto survei 3 (sesuai/di luar radius/mock), 20-30 titik peta, rekaman 2, template script. Semua fiktif.

## 11. Fase
Demo/PoC (Skenario A) -> Fase 1 MVP pilot 1-2 cabang -> Fase 2 ICR, QA collection/CS, heatmap, LOS penuh -> Fase 3 credit analyst, agunan, data eksternal.

## 12. Risiko & Terbuka
Integrasi Dukcapil/BPN butuh kerja sama resmi. Logat daerah dievaluasi di pilot. Belum ada case study: tawarkan pilot. Konfirmasi: format presentasi, sistem telepon & format rekaman, LOS, cloud/on-prem, volume per bulan, produk agunan properti.
