# Testara: Brief Proyek untuk Claude Code

> File ini dibaca di awal setiap sesi dan menjadi acuan utama proyek. Jika instruksi di chat bertentangan dengan file ini, tanyakan dulu sebelum bertindak, kecuali dalam mode otonom (Bagian 0A). Di awal setiap sesi, baca `PROGRESS.md` jika ada.

## 0. Cara kamu bekerja di proyek ini

- Kerjakan per fase (Bagian 11). Sebelum mulai satu fase, tulis rencana singkat (file yang dibuat/diubah, risiko) dan tunggu "lanjut".
- Di akhir setiap fase: jalankan `npm run lint`, `npm run typecheck`, `npm test`, dan `npm run build`, laporkan hasilnya, ringkas apa yang berubah, lalu **berhenti dan tunggu persetujuan**.
- Jangan menambah fitur di luar brief. Kalau menurutmu ada yang perlu ditambah, usulkan dulu.
- Jangan pernah mengarang data: statistik, testimoni, nama mitra, logo, nomor telepon resmi, atau angka akurasi. Angka akurasi hanya boleh berasal dari hasil `npm run eval` yang benar-benar dijalankan.
- Sebelum memakai layanan pihak ketiga (Groq, Google Gemini, Supabase, Vercel), cek dokumentasi resminya untuk model ID, batas free tier, dan sintaks terbaru. Jangan mengandalkan ingatan.
- Git: commit kecil per langkah logis dengan format Conventional Commits (`feat: ...`, `fix: ...`, `test: ...`, `docs: ...`), deskripsi singkat dalam bahasa Indonesia.
- **Dilarang** `git push --force`, rebase pada branch yang sudah di-push, `git commit --amend` setelah push, atau menghapus history. Aturan lomba melarang manipulasi riwayat commit. Jika API key tidak sengaja ter-commit, berhenti dan beri tahu saya; solusinya rotasi key, bukan menulis ulang history.
- Jangan membaca, mencetak, atau menyalin isi `.env.local` ke chat, log, atau file lain.
- Teks UI dalam bahasa Indonesia. Nama variabel, fungsi, dan file dalam bahasa Inggris. Komentar kode boleh bahasa Indonesia, singkat, dan hanya untuk menjelaskan "kenapa".

## 0A. Mode otonom (berlaku jika prompt diawali "MODE OTONOM")

Saya mungkin sedang tidur. Tujuanmu: menyelesaikan Fase 0 sampai 5 tanpa menunggu saya, dengan hasil yang aman dan bisa saya tinjau di pagi hari.

- **Yang tidak berlaku:** aturan "tunggu persetujuan" di Bagian 0 dan "ajukan rencana desain lalu tunggu" di Bagian 7. Putuskan sendiri sesuai brief. Catat rencana desain di `docs/DESIGN.md` dan setiap keputusan penting beserta alasannya di `docs/DECISIONS.md`.
- **Yang tetap berlaku:** semua larangan di Bagian 0 (riwayat git, isi `.env.local`, mengarang data) dan semua prinsip produk di Bagian 2.
- **Urutan:** Fase 0 sampai 5. Jangan mulai Fase 6.
- **Gerbang setiap fase:** lint, typecheck, test, dan build lulus, lalu commit, push ke `main` (Vercel deploy otomatis), cek URL produksi bisa dibuka jika memungkinkan, lalu perbarui `PROGRESS.md`.
- **Format `PROGRESS.md`:** fase yang selesai, yang sedang dikerjakan, langkah berikutnya, bagian "Butuh tindakan saya", dan bagian "Perlu ditinjau" (keputusan desain atau teknis yang sebaiknya saya cek).
- **Jika terhalang** (kunci API tidak ada, CLI belum login, layanan error): jangan berhenti. Catat di "Butuh tindakan saya", buat stub atau mock yang jelas ditandai `TODO(manusia)`, lalu lanjutkan bagian lain yang tidak terhalang. Hasil AI untuk data demo hanya boleh dibuat dengan memanggil AI sungguhan; jika kunci belum ada, catat sebagai "Butuh tindakan saya", jangan dikarang.
- **Test:** jangan menghapus atau melemahkan test agar lulus. Unit test untuk aturan urgensi, verifikasi kutipan, penjaga angka, dan penjaga jawaban tidak boleh di-skip. Jika test E2E gagal dan tidak bisa diperbaiki setelah 3 percobaan, tandai `test.skip` dengan alasan tertulis dan cantumkan di "Butuh tindakan saya".
- **Batas tindakan:** jangan membuat akun, membeli apa pun, atau mengubah pengaturan akun layanan. Jangan menjalankan perintah yang menghapus data di database remote (mis. `supabase db reset --linked`). Migrasi hanya menambah, tidak menghapus tabel berisi data.
- **Jika sesi atau kuota hampir habis:** berhenti di titik yang rapi. Commit pekerjaan yang sudah lulus gerbang, lalu pastikan `PROGRESS.md` menjelaskan posisi terakhir dan langkah berikutnya.

## 1. Konteks lomba

- Lomba Web Development IT RUSH 2026 (HIMATIF Universitas Bengkulu), subtema 4: Mitigasi Bencana dan Perubahan Iklim.
- Batas pengumpulan 20 November 2026 pukul 23.59 WIB. Website wajib online dan bisa diakses publik sampai 30 November 2026. Penjurian 28–29 November 2026.
- Juri menilai secara asinkron tanpa presentasi: mencoba live website sendiri, membaca source code di repo publik, menonton video demo 3–5 menit, dan membaca proposal.
- Rubrik: Fungsionalitas & Kualitas Teknis 25%, Inovasi & Ketepatan Solusi 20%, Relevansi Tema & Dampak 15%, UI/UX 15%, Kualitas Source Code 15%, Dokumentasi 10%.
- Konsekuensinya:
  - Juri harus bisa mencoba alur utama, dari sisi korban dan sisi petugas, dalam kurang dari 2 menit tanpa penjelasan.
  - Demo tidak boleh gagal walaupun kuota API AI habis.
  - Kode harus rapi dan mudah dibaca orang lain.
  - Semua tools dan model AI yang dipakai, termasuk Claude Code, dicantumkan di README.

## 2. Produk

**Judul lengkap:** TESTARA: Platform Respons Bencana Dua Arah Berbasis AI untuk Pelaporan Korban Tanpa Aplikasi, Prioritas Penanganan Kelompok Rentan, dan Informasi Posko Terverifikasi.

**Nama:** Testara, dari kata Latin *testis* yang berarti saksi. Setiap laporan dan setiap angka punya saksi berupa kalimat sumbernya.

Pakai judul ini secara konsisten:
- `<title>` halaman beranda: "Testara: Platform Respons Bencana Dua Arah". Meta description memakai judul lengkap di atas.
- README dibuka dengan judul lengkap.
- Tiga bagian judul adalah peta fitur: **pelaporan korban tanpa aplikasi** (Bagian 3, sisi korban), **prioritas penanganan kelompok rentan** (aturan urgensi dan antrean petugas), dan **informasi posko terverifikasi** (papan info dan tanya papan info). Fitur yang tidak mendukung salah satu dari tiga bagian ini bukan prioritas.

**Tujuan:** korban bencana cukup bercerita dengan cara paling mudah, lalu tahu bahwa ceritanya sampai, ditangani, dan dibalas dengan informasi yang benar. Petugas BPBD dan posko adalah "dapur" yang membuat itu terjadi: Testara meringankan kerja mereka memeriksa laporan, mendahulukan yang paling mendesak, dan menerbitkan informasi resmi.

**Pengguna:**
- **Utama: korban dan orang yang melapor untuk korban** (tetangga, keluarga di luar daerah, relawan, pengungsi di posko). Memakai HP Android kelas menengah ke bawah, sinyal sering lemah, baterai terbatas, sedang panik atau lelah. Sebagian lansia atau tidak terbiasa mengetik.
- **Pendukung: petugas.** Operator Pusdalops PB BPBD kabupaten/kota, anggota TRC, dan koordinator posko relawan. Memakai laptop kantor atau HP, dan menerima laporan dari banyak arah, termasuk grup WhatsApp kepala desa dan camat.

**Masalah:**
- Korban dan keluarganya tidak tahu harus melapor ke mana, tidak tahu apakah laporannya dibaca, dan menerima kabar simpang siur soal pengungsian dan bantuan.
- Petugas yang jumlahnya terbatas menerima laporan berulang dengan angka berbeda, lalu membaca semuanya secara manual. Laporan yang paling mendesak bisa tenggelam, dan angka sering dikoreksi belakangan.

Fakta bersumber untuk halaman "Cara kerja" (kutip dengan tautan, jangan ubah angkanya):
- Sepanjang 2025 BNPB mencatat 3.233 kejadian bencana: https://indonesiabaik.id/infografis/indonesia-tangguh-menghadapi-bencana-2025
- 3 Desember 2025, BNPB mengoreksi data korban banjir Sumatra menjadi 770 meninggal dan 462 hilang: https://www.cnnindonesia.com/nasional/20251203190705-20-1302487/bnpb-koreksi-data-korban-banjir-sumatra-770-meninggal-462-hilang

**Prinsip produk (pegang di setiap keputusan):**
1. **Korban didahulukan.** Uji setiap keputusan desain dengan pertanyaan: apakah ini memudahkan orang yang sedang panik, memegang HP murah, dengan sinyal lemah?
2. **Tanpa instal dan tanpa akun untuk korban.** Cukup membuka tautan.
3. **Laporan disimpan dulu, AI belakangan.** Laporan korban tidak boleh gagal terkirim karena AI error atau kuota habis.
4. **AI hanya membantu.** AI merapikan laporan, mengusulkan urgensi, dan menjawab dari data resmi. Petugas yang memutuskan dan menerbitkan.
5. **Setiap angka punya saksi.** Setiap angka dan klaim punya kutipan dari pesan asal; yang kutipannya tidak terverifikasi dibuang. Data kosong ditulis "tidak disebut", bukan 0. Angka yang berbeda antar pelapor tidak dipilih otomatis.
6. **Jujur kepada korban.** Status menunjukkan laporan sudah dibaca dan diproses, bukan janji kapan bantuan datang. Jika informasi belum ada, katakan belum ada.
7. **Privasi.** Halaman publik tidak memuat nama atau nomor HP siapa pun. Nomor HP pelapor hanya terlihat petugas dan tidak pernah dikirim ke AI. Laporan dihapus otomatis setelah 30 hari.
8. **Keselamatan.** Di atas formulir lapor selalu ada ajakan menelepon nomor darurat setempat jika ada nyawa yang terancam. Testara tidak menggantikan layanan darurat. Nomor darurat dan nomor posko diisi lewat konfigurasi; di demo, pakai nomor contoh yang diberi label jelas.

## 3. Fitur

### Wajib (MVP): sisi korban
1. **Beranda:** tombol utama besar "Saya perlu bantuan / mau melapor", tautan papan info, dan tautan kecil "Masuk petugas".
2. **Halaman lapor (tanpa login):**
   - Pilih desa lewat pencarian sederhana dari daftar desa kabupaten; ingat pilihan terakhir di perangkat.
   - Tombol kebutuhan besar, boleh pilih lebih dari satu: Evakuasi/terjebak, Air bersih, Makanan, Obat/perawatan, Tempat mengungsi, Lainnya.
   - Centang orang yang perlu didahulukan: lansia, disabilitas, ibu hamil, bayi/balita, orang sakit.
   - Kotak cerita bebas: "Ceritakan apa yang terjadi. Boleh singkat, boleh bahasa daerah." Beri petunjuk bahwa tombol mikrofon di keyboard HP bisa dipakai untuk bicara.
   - Pilihan "Untuk saya sendiri" atau "Untuk orang lain".
   - Nomor HP untuk dihubungi petugas (tidak wajib).
   - Persetujuan penyimpanan (wajib dicentang) dengan penjelasan satu kalimat.
   - Minimal salah satu harus diisi: tombol kebutuhan atau cerita.
3. **Tanda terima:** kode laporan acak yang sulit ditebak (mis. `TS-7K4Q-9M2X`), tombol salin kode, tautan halaman status, dan tautan papan info desanya.
4. **Cadangan saat sinyal jelek:**
   - Draf formulir tersimpan di perangkat (localStorage, dibungkus try/catch) agar tidak hilang saat halaman dimuat ulang.
   - Jika pengiriman gagal setelah satu kali coba ulang otomatis, tampilkan tombol "Kirim lewat WhatsApp" yang membuka WhatsApp ke nomor posko dengan pesan yang sudah tersusun rapi (`https://wa.me/<nomor>?text=...`), serta tombol "Salin pesan".
5. **Halaman status (dengan kode):** desa, kategori kebutuhan, linimasa status (Diterima, Dibaca petugas, lalu Masuk laporan resmi atau Perlu konfirmasi), waktu pembaruan terakhir, dan tautan papan info. Tidak menampilkan isi cerita atau nomor HP. Selalu tampilkan kalimat: "Status ini menunjukkan laporan Anda sudah diproses petugas, bukan jaminan waktu kedatangan bantuan."
6. **Papan info per desa (publik):** lokasi pengungsian, titik bantuan (air bersih, dapur umum, pos kesehatan), kebutuhan yang diumumkan, kontak posko, dan waktu pembaruan terakhir. Hanya berisi apa yang diterbitkan petugas. Ada tombol "Bagikan ke WhatsApp".
7. **Tanya papan info:** kolom tanya, misalnya "Di mana posko terdekat?" atau "Di mana ambil air bersih?". AI hanya menjawab dari papan info yang sudah diterbitkan dan menyebut bagian papan yang dipakai. Jika datanya tidak ada, jawabannya "Belum ada informasi resmi untuk itu" beserta kontak posko.

### Wajib (MVP): sisi petugas
8. **Masuk petugas** dengan Supabase Auth. Akun dibuat admin; tidak ada pendaftaran publik.
9. **Antrean laporan:**
   - Diurutkan berdasarkan urgensi, lalu waktu.
   - Setiap laporan menampilkan kebutuhan, orang yang perlu didahulukan, ringkasan AI dengan kutipan, alasan urgensi, dan label "belum diverifikasi".
   - Filter per desa dan status.
   - Laporan yang gagal diproses AI tetap tampil apa adanya dengan label "belum dirapikan AI".
10. **Tambah laporan dari WhatsApp:** tempel satu atau banyak pesan, atau unggah `.txt` hasil ekspor chat. Pesan dipecah, disamarkan, lalu masuk antrean sebagai laporan bersumber "WhatsApp".
11. **Meja periksa per kejadian:**
    - Laporan dikelompokkan per desa dan jenis kejadian.
    - Tabel angka dengan kutipan; klik angka, kalimat sumbernya tersorot.
    - Angka yang berbeda ditandai dan dipilih petugas.
    - Petugas bisa mengubah urgensi dan status laporan. Perubahan status langsung tercermin di halaman status korban.
12. **Terbitkan papan info:** petugas mengisi atau menyetujui isi papan info desa lewat formulir terstruktur. AI boleh mengusulkan isi dari laporan yang sudah diperiksa, tapi petugas yang menyunting dan menekan "Terbitkan". Riwayat versi disimpan.
13. **Salin ringkasan untuk WhatsApp:** ringkasan kejadian per desa dari data yang sudah diperiksa, disusun dengan template (format WA `*tebal*`), untuk dikirim ke pimpinan.

### Wajib: demo dan ketahanan
14. **Mode demo** (Bagian 6.1): juri bisa memainkan peran korban dan petugas tanpa mendaftar, dengan data contoh, tanpa mengotori data sungguhan.
15. **Ketahanan:** cache, pembatasan laju, anggaran harian, dua penyedia AI, dan laporan tetap tersimpan saat AI gagal.
16. **Halaman Cara kerja dan Privasi.**

### Tambahan (hanya setelah MVP selesai dan saya setujui)
- Unggah foto pada laporan.
- Transkripsi pesan suara.
- Konteks peringatan dini BMKG di papan info (cantumkan BMKG sebagai sumber).
- Peta lokasi pengungsian dan titik bantuan (Leaflet + OpenStreetMap).
- Ringkasan situasi oleh AI dengan penjaga angka; ekspor PDF dan CSV.
- Notifikasi perubahan status kepada pelapor.

## 4. Pipeline AI

Ada tiga alur AI. Semua bagian deterministik (parser, aturan urgensi, verifikasi, pengelompokan, penjaga) adalah fungsi murni dengan unit test.

### 4A. Laporan warga: rapikan dan usulkan urgensi

```
kirim formulir → simpan mentah ke DB (status: Diterima) → tampilkan kode ke pelapor
  → (setelah tersimpan) LLM ekstraksi + usulan urgensi → verifikasi kutipan
  → aturan urgensi deterministik → simpan hasil → tampil di antrean petugas
```

- Pelapor tidak pernah menunggu AI. Panggil pemrosesan setelah laporan tersimpan (mis. `POST /api/reports/[id]/process` dipanggil klien setelah sukses). Laporan yang belum terproses diproses ulang saat antrean dibuka petugas.
- Nomor HP pelapor tidak ikut dikirim ke AI.
- Skema keluaran:

  ```ts
  type ReportExtraction = {
    locationText: string | null;     // persis seperti ditulis pelapor
    hazard: Hazard | null;           // lihat daftar di 4B
    claims: Claim[];                 // angka dampak, lihat 4B
    needs: ("evakuasi" | "air_bersih" | "makanan" | "obat" | "pengungsian" | "lainnya")[];
    vulnerable: ("lansia" | "disabilitas" | "ibu_hamil" | "bayi_balita" | "orang_sakit")[];
    urgency: "tinggi" | "sedang" | "rendah";
    urgencyReason: string;           // satu kalimat
    urgencyQuote: string | null;     // potongan teks PERSIS pendukung urgensi
    summary: string;                 // maks. 25 kata
    possiblyIrrelevant: boolean;     // tampak iseng atau tidak terkait bencana
  };
  ```

- **Aturan urgensi deterministik** (di kode, bukan LLM, di `src/lib/triage/`): urgensi minimal "tinggi" jika
  - kebutuhan "Evakuasi/terjebak" dipilih, atau
  - ada orang yang perlu didahulukan bersama kebutuhan evakuasi atau obat, atau
  - teks memuat kata kunci bahaya dari `src/lib/triage/keywords.ts` (terjebak, tidak bisa keluar, hanyut, tertimbun, sesak napas, pingsan, luka parah, pendarahan, serta padanan informal dan salah ketik yang umum).
- LLM boleh menaikkan urgensi, tapi tidak boleh menurunkannya di bawah hasil aturan. Petugas bebas mengubah urgensi; simpan sumber urgensi (`aturan`, `ai`, atau `petugas`).
- `possiblyIrrelevant` hanya menandai. Laporan tidak pernah disembunyikan atau dihapus otomatis.
- `summary` melewati penjaga angka (4D).

### 4B. Pesan WhatsApp yang ditempel petugas

- **Parse** (`src/lib/whatsapp/parse.ts`): format ekspor Android dan iPhone, jam 12/24, pemisah titik atau titik dua, pesan multi-baris, pesan sistem (media tidak disertakan, pesan dihapus, bergabung/keluar, perubahan nama grup, beserta padanan bahasa Inggris). Jika format tidak dikenali, perlakukan tiap baris tak kosong sebagai satu pesan tanpa jam.
- **Samarkan** nomor HP Indonesia (+62, 62, 08) menjadi `[nomor disamarkan]` sebelum dikirim ke server.
- **Batch** 15–20 pesan per panggilan. Klien memanggil endpoint satu kali per batch, supaya progres terlihat dan tidak terkena batas durasi serverless function.
- **Ekstraksi klaim:**

  ```ts
  type Hazard =
    | "banjir" | "banjir_bandang" | "tanah_longsor" | "cuaca_ekstrem" | "angin_kencang"
    | "gelombang_pasang_abrasi" | "kebakaran_hutan_lahan" | "gempa_bumi" | "lainnya";

  type Claim = {
    messageId: string;
    locationText: string;    // persis seperti ditulis pelapor
    hazard: Hazard;
    field:
      | "meninggal" | "hilang" | "luka" | "mengungsi_jiwa" | "mengungsi_kk"
      | "terdampak_jiwa" | "terdampak_kk" | "rumah_rusak_berat" | "rumah_rusak_sedang"
      | "rumah_rusak_ringan" | "rumah_terendam" | "fasilitas_rusak"
      | "kebutuhan_mendesak" | "upaya_penanganan" | "kondisi_terkini";
    value: number | string;  // angka untuk field hitungan, teks pendek untuk lainnya
    approximate: boolean;    // true untuk "sekitar", "kurang lebih"
    quote: string;           // potongan teks PERSIS dari pesan
  };
  ```

- Aturan di prompt: jangan menebak; kata bilangan ("tiga KK") diubah ke digit, tapi kutipan tetap persis; "puluhan" atau "banyak" tidak dijadikan angka melainkan masuk `kondisi_terkini`; pesan yang hanya meneruskan peringatan cuaca bukan laporan kejadian.
- Setiap pesan yang relevan menjadi laporan bersumber "WhatsApp" di antrean, lalu melewati aturan urgensi yang sama dengan 4A.

### 4C. Tanya papan info

- Masukan untuk LLM hanya pertanyaan dan JSON papan info yang sudah diterbitkan untuk desa itu (ditambah desa lain di kecamatan yang sama, jika ada). Tidak ada data lain.
- Keluaran: `{ answer: string, usedItems: string[], found: boolean }`. `usedItems` berisi ID butir papan info yang dipakai.
- **Penjaga jawaban:** setiap ID di `usedItems` harus ada, dan setiap angka, jam, serta nama tempat di jawaban harus muncul di butir yang dirujuk. Jika gagal atau `found` bernilai false, tampilkan "Belum ada informasi resmi untuk itu", kontak posko, dan butir papan yang paling relevan berdasarkan pencocokan kata kunci.
- Prompt menolak memberi saran medis atau hukum. Untuk keadaan darurat, arahkan ke nomor darurat yang tercantum.

### 4D. Bagian bersama

- **Verifikasi kutipan:** normalisasi (huruf kecil, rapikan spasi, seragamkan tanda kutip). Kutipan wajib muncul sebagai substring teks sumber, dan angka pada klaim hitungan harus bisa ditelusuri ke kutipan. Jika gagal, klaim dibuang dan dicatat di `droppedClaims` untuk evaluasi.
- **Penjaga angka:** setiap angka dalam teks buatan AI (ringkasan, jawaban, usulan papan info) wajib ada di data sumbernya. Jika tidak, pakai versi template atau tolak jawaban.
- **Normalisasi lokasi:** cocokkan teks lokasi dengan daftar desa/kecamatan kabupaten memakai pencocokan fuzzy (mis. Fuse.js). Hanya jika ambigu, minta LLM memilih dari kandidat yang diberikan. Data wilayah: dataset kode wilayah Kemendagri yang terbuka dan lisensinya jelas, subset Provinsi Bengkulu, di `data/wilayah/`, dengan sumber dan lisensi di README. Jika tidak ada yang lisensinya jelas, beri tahu saya.
- **Pengelompokan:** satu kejadian = (desa, jenis bencana). Angka berbeda dalam satu kejadian ditandai; semua nilai disimpan beserta jam, sumber, dan kutipannya.
- **Prompt** disimpan di `src/lib/ai/prompts/` dengan konstanta `PROMPT_VERSION`. Pakai structured output/JSON schema jika didukung penyedia, selalu validasi dengan Zod, dan ulangi sekali dengan pesan error jika gagal.

## 5. Teknologi, data, dan keamanan

- Next.js (App Router, versi stabil terbaru) + TypeScript `strict`, Tailwind CSS dengan token desain sendiri (Bagian 7), Zod, Vitest, Playwright, ESLint + Prettier, npm.
- Penyedia AI di balik satu antarmuka `AIProvider` (`src/lib/ai/providers/`):
  - Utama: Groq, model `openai/gpt-oss-120b`. Cek ulang ID, dukungan structured output, dan batasnya.
  - Cadangan: Google Gemini, varian Flash-Lite terbaru. Di free tier, prompt dapat dipakai Google, jadi hanya kirim teks yang sudah disamarkan.
- Supabase: Postgres + Auth (khusus petugas). Hosting di Vercel (Hobby, non-komersial).

**Tabel (usulan; boleh dirancang ulang dengan alasan):**
- `reports`: id, public_code, demo_session_id (nullable), village_id, needs, vulnerable, for_self, story_text, reporter_phone (nullable), source (`form` | `whatsapp`), status, urgency, urgency_source, extraction (jsonb), created_at, expires_at.
- `report_events`: report_id, status, actor (`system` | `petugas`), created_at. Sumber linimasa di halaman status.
- `incidents`: desa, jenis bencana, nilai terpilih per field, diperiksa oleh, diperiksa pada.
- `boards` dan `board_versions`: papan info per desa dengan isi terstruktur (pengungsian, titik bantuan, kebutuhan diumumkan, kontak posko, catatan), published_at, published_by.
- `ai_cache`, `rate_limits`, `usage_daily`.

**Akses (RLS):**
- Publik tidak membaca atau menulis tabel secara langsung; semua lewat route handler di server.
- Halaman status hanya mengambil kolom yang aman berdasarkan `public_code`.
- Papan info publik hanya menampilkan versi yang sudah diterbitkan.
- Petugas yang login membaca dan mengubah laporan di kabupatennya.

**Retensi:** workflow GitHub Actions harian memanggil route yang dilindungi `CRON_SECRET` untuk menghapus laporan yang melewati `expires_at` (30 hari) dan data demo yang berumur lebih dari 24 jam. Panggilan yang sama menjaga proyek Supabase free tier tetap aktif.

**Keamanan:**
- Variabel lingkungan: `GROQ_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DAILY_AI_REQUEST_BUDGET`, `IP_HASH_SALT`, `CRON_SECRET`, `EMERGENCY_NUMBER_LABEL`, `POSKO_WHATSAPP_NUMBER`. Tidak ada kunci rahasia yang diberi prefix `NEXT_PUBLIC_`.
- Modul yang memegang kunci memakai `import "server-only"`. `.env.local` masuk `.gitignore`; sediakan `.env.example` berisi placeholder.
- Jangan log isi laporan. Log hanya metadata: jumlah, durasi, penyedia, kode error.

**Halaman korban harus ringan:** hindari library berat di halaman lapor, status, dan papan info. Uji dengan throttling "Slow 3G" di DevTools dan pastikan formulir tetap bisa diisi dan dikirim.

```
Korban/pelapor ── /lapor ──► POST /api/reports ──► simpan (Diterima) ──► kode laporan
                                   │
                                   └─► /api/reports/[id]/process ──► AI (Groq → Gemini)
                                          ──► verifikasi kutipan + aturan urgensi ──► antrean

Petugas ── /petugas ──► antrean, tempel WhatsApp, meja periksa ──► ubah status ──► halaman status korban
                                                              └──► terbitkan papan info ──► /info/[desa]
Korban ── /info/[desa] ──► POST /api/ask ──► AI + penjaga jawaban ──► jawaban dari data resmi
```

Struktur folder (boleh disesuaikan, jelaskan alasannya):

```
src/app/(warga)/          beranda, lapor, status/[code], info/[village]
src/app/petugas/          masuk, antrean, tambah-whatsapp, kejadian/[id], papan/[village]
src/app/api/              reports, process, ask, whatsapp/extract, board, health, cron
src/components/           komponen UI
src/lib/whatsapp/         parser
src/lib/privacy/          penyamaran
src/lib/ai/               providers, prompts, schemas
src/lib/triage/           aturan urgensi dan kata kunci
src/lib/extract/          verifikasi kutipan, lokasi, pengelompokan, angka berbeda
src/lib/board/            papan info dan penjaga jawaban
src/lib/db/               klien Supabase server-only dan query
supabase/migrations/      skema dan RLS
data/demo/                data contoh + hasil AI tersimpan (JSON)
data/wilayah/             subset data wilayah Provinsi Bengkulu
eval/                     kasus uji berlabel + skrip evaluasi
tests/                    unit test dan e2e
```

## 6. Demo, kuota, dan ketahanan

### 6.1 Mode demo untuk juri
- Beranda punya pita kecil "Mode demo untuk juri" dengan dua tombol: "Coba sebagai korban" dan "Coba sebagai petugas".
- Mode demo memakai cookie `demo_session_id`. Semua data yang dibuat juri hanya terlihat di sesi itu dan dihapus setelah 24 jam, sehingga juri tidak bisa mengotori data sungguhan atau data juri lain.
- Sesi demo langsung terisi data contoh (Bagian 8). Hasil AI untuk data contoh sudah tersimpan di `data/demo/`, jadi tidak memanggil AI.
- Masuk sebagai petugas demo cukup satu klik tanpa kata sandi, hanya berlaku di sesi demo, dan tidak bisa mengakses data sungguhan.
- Alur demo yang harus mulus dalam kurang dari 2 menit:
  1. Sebagai korban: kirim laporan dengan bahasa santai dan centang "lansia"; kode laporan muncul.
  2. Pindah ke petugas: laporan itu ada di urutan atas beserta alasan urgensinya.
  3. Tandai dibaca, periksa, lalu terbitkan papan info.
  4. Kembali ke korban: status sudah berubah, dan pertanyaan "posko terdekat?" dijawab dari papan info.
- Laporan baru dari juri memanggil AI (panggilan kecil). Jika AI gagal, laporan tetap tampil di antrean dengan label "belum dirapikan AI" dan urgensi dari aturan deterministik.

### 6.2 Kuota dan ketahanan
- Cache: input yang sama tidak pernah diproses dua kali (kunci sha256 teks tersamar + `PROMPT_VERSION` + model).
- Rate limit per IP (di-hash dengan salt): 5 laporan per jam dari formulir, 10 proses tempel WhatsApp per jam, 20 pertanyaan per jam. Pesan batas harus jelas dan menyebut kapan bisa mencoba lagi. Untuk formulir korban, pesan batas tetap menawarkan "Kirim lewat WhatsApp".
- Anggaran harian global (`DAILY_AI_REQUEST_BUDGET`) di `usage_daily`. Jika habis, laporan tetap disimpan tanpa AI dan tanya papan info menampilkan butir papan yang relevan tanpa jawaban AI.
- Fallback penyedia otomatis saat 429, 5xx, atau timeout (25 detik per panggilan).
- `/api/health`: status database dan apakah tiap penyedia sudah dikonfigurasi, tanpa membocorkan kunci.

## 7. Desain: dua wajah, satu identitas

### Arah
- **Sisi korban** terasa seperti petugas posko yang sabar menyambut: tenang, ramah, sangat jelas. Satu tugas per layar, tidak ada istilah teknis, formulir terasa singkat. Target sentuh minimal 48 px, teks dasar minimal 17 px, kontras tinggi.
- **Sisi petugas** adalah alat kerja yang padat: transkrip laporan di satu sisi, data kejadian di sisi lain, dan stabilo kuning yang menandai kalimat sumber, seperti petugas yang mencetak laporan lalu menandainya dengan stabilo.
- Keduanya memakai token, tipografi, dan nada bahasa yang sama.

### Satu elemen yang diingat
**Tanda terima laporan untuk korban.** Setelah mengirim, korban melihat layar yang menenangkan: kalimat "Laporan Anda sudah kami terima", kode laporan berukuran besar yang mudah disalin, dan linimasa status yang jelas. Di halaman status, linimasa yang sama bergerak saat petugas bertindak. Semua keberanian visual dihabiskan di sini; elemen lain tenang dan disiplin.

Sorotan stabilo di sisi petugas bersifat fungsional (menghubungkan angka dengan kutipan), bukan dekorasi. Saat angka diklik, panel menggulir ke kutipan dan menandainya dengan satu sapuan singkat (sekitar 200 ms, nonaktif jika `prefers-reduced-motion`).

### Token awal (boleh disempurnakan, alasan wajib dijelaskan)
| Peran | Nilai | Catatan |
|---|---|---|
| Latar | `#F3F5F4` | putih keabuan dingin, seperti papan tulis posko |
| Permukaan panel | `#FFFFFF` | |
| Tinta | `#1B2A3A` | biru tua, merujuk warna institusi kebencanaan |
| Teks sekunder | `#566573` | |
| Perlu tindakan | `#E8620C` | oranye keselamatan, hanya untuk urgensi tinggi, angka berbeda, dan "belum diperiksa"; dipakai sebagai garis/penanda, teks oranye pakai varian lebih gelap agar lolos WCAG AA |
| Stabilo | `#FFE14D` | hanya untuk menandai kutipan sumber |
| Selesai/terkonfirmasi | `#2E7D4F` | |

**Tipografi:**
- Satu keluarga untuk seluruh UI: Atkinson Hyperlegible Next (Braille Institute) lewat `next/font`. Jika tidak tersedia di Google Fonts, pakai Atkinson Hyperlegible.
- Alasan: huruf ini dirancang agar karakter yang mirip (1/l/I, 0/O) mudah dibedakan. Penting bagi korban lansia, bagi kode laporan yang harus disalin, dan bagi angka korban yang dibaca petugas yang lelah.
- Pakai angka tabular di kolom angka, jam, dan kode laporan. Jika font tidak mendukung, pakai Atkinson Hyperlegible Mono khusus untuk kode laporan dan kolom angka.

**Bentuk:** radius mengikuti hierarki, tidak seragam. Tombol kebutuhan di sisi korban boleh lebih lapang dan berisi; panel petugas tanpa radius dengan pemisah 1 px. Bayangan hanya untuk elemen yang melayang.

### Tata letak
Halaman lapor (mobile, prioritas utama):

```
+----------------------------------+
| Testara               Papan info |
+----------------------------------+
| Ada yang terancam nyawanya?      |
| Telepon [nomor darurat] sekarang.|
+----------------------------------+
| Desa Anda                        |
| [ Cari desa...               ]   |
|                                  |
| Apa yang dibutuhkan?             |
| [ Evakuasi ]   [ Air bersih ]    |
| [ Makanan  ]   [ Obat       ]    |
| [ Tempat mengungsi ] [ Lainnya ] |
|                                  |
| Ada yang perlu didahulukan?      |
| [ ] Lansia      [ ] Disabilitas  |
| [ ] Ibu hamil   [ ] Bayi/balita  |
| [ ] Orang sakit                  |
|                                  |
| Ceritakan (boleh singkat)        |
| [                            ]   |
|                                  |
| (o) Untuk saya  ( ) Orang lain   |
| Nomor HP (tidak wajib) [       ] |
| [x] Saya setuju laporan disimpan |
|                                  |
| [        Kirim laporan       ]   |
+----------------------------------+
```

Antrean petugas (desktop, rata kiri):

```
+---------------------------------------------------------------------+
| Testara  Petugas    Antrean   Kejadian   Papan info          Keluar |
+---------------------------+-----------------------------------------+
| Antrean (14)              | Laporan TS-7K4Q-9M2X                    |
|                           | Desa X, 21.10, dari formulir            |
| Mendesak (3)              |                                         |
|  Desa X  evakuasi, lansia | Kebutuhan: evakuasi, obat               |
|  Desa Y  terjebak         | Didahulukan: lansia                     |
|  Desa X  orang sakit      | Urgensi tinggi karena: "nenek tdk bisa  |
|                           | keluar rmh" (aturan + AI)               |
| Lainnya (11)              |                                         |
|  Desa Z  air bersih       | Cerita: ... [kutipan tersorot] ...      |
|  ...                      |                                         |
|                           | [Tandai dibaca]  [Perlu konfirmasi]     |
+---------------------------+-----------------------------------------+
```

Di layar sempit, antrean dan detail laporan menjadi dua langkah: daftar lalu detail, dengan tombol kembali.

### Larangan (cek sebelum dan sesudah membangun UI)
- Latar krem hangat dengan judul serif kontras tinggi dan aksen terakota; latar hampir hitam dengan satu aksen hijau neon atau oranye terang; tata letak gaya koran dengan garis tipis di mana-mana.
- Kartu membulat identik untuk semua konten, radius yang sama di semua elemen, bayangan abu-abu tipis seragam, gradien sebagai hiasan, glassmorphism, blob.
- Label kecil HURUF KAPITAL berjarak lebar di atas setiap judul; string meta dipisah titik tengah ("A · B · C"); label "KATA — penggalan"; panah "→" di setiap tombol atau tautan; font monospace untuk label kecil dekoratif.
- Satu kata di judul diberi warna, tebal, atau miring berbeda.
- Penanda bernomor 01/02/03 untuk konten yang bukan urutan.
- Ikon sparkle atau bintang ajaib untuk AI, badge "Powered by AI", emoji di UI.
- Ilustrasi kartun bencana, merah alarm di mana-mana, hitung mundur, atau elemen yang menambah panik.
- Hero pemasaran dengan angka besar dan aksen gradien; grid tiga kartu fitur; testimoni, logo mitra, atau statistik pengguna yang tidak nyata.
- Animasi fade/slide di setiap section saat scroll; efek hover membesar di setiap kartu.
- Font yang dipakai di mana-mana (Inter, Poppins, Plus Jakarta Sans, Montserrat, Space Grotesk, Roboto) dan palet bawaan Tailwind (`blue-500`, `slate-*`) tanpa token sendiri.
- Tampilan bawaan shadcn/ui apa adanya. Radix atau shadcn boleh dipakai untuk aksesibilitas, tapi gayanya wajib mengikuti token.
- Kata promosi: "revolusioner", "canggih", "cerdas", "seamless", "solusi terdepan", "memberdayakan", "era digital".

### Tulisan di antarmuka
- Bahasa Indonesia sehari-hari, kalimat pendek, huruf kalimat biasa. Untuk korban, sapa dengan "Anda" dan pakai kata yang mereka kenal: "laporan", "bantuan", "pengungsian", bukan "tiket", "entri", atau "submit".
- Contoh untuk korban:
  - Tanda terima: "Laporan Anda sudah kami terima. Simpan kode ini untuk melihat perkembangannya."
  - Gagal kirim: "Laporan belum terkirim karena sinyal. Kirim lewat WhatsApp, atau coba lagi."
  - Tanya tanpa data: "Belum ada informasi resmi untuk itu. Hubungi posko di nomor berikut."
- Contoh untuk petugas: "pesan", "kejadian", "angka berbeda", "sudah diperiksa", bukan "klaim", "entitas", atau "konflik data". Tombol menyebut hasilnya dan konsisten: "Terbitkan papan info" menghasilkan "Papan info diterbitkan".
- Label AI jujur di sisi petugas: "Dirapikan otomatis. Periksa sebelum ditindaklanjuti."
- Pesan error menjelaskan apa yang terjadi dan apa yang bisa dilakukan, tanpa minta maaf dan tanpa kalimat samar.

### Proses desain yang wajib diikuti
1. Sebelum menulis kode UI, ajukan rencana desain: palet (hex), tipografi dan perannya, wireframe ASCII sisi korban (mobile) dan sisi petugas (desktop dan mobile), serta prinsipnya. Periksa sendiri terhadap daftar larangan, tulis apa yang kamu ubah dan kenapa, lalu tunggu persetujuan.
2. Setelah UI dibangun, ambil screenshot dengan Playwright di lebar 375 px dan 1440 px untuk: halaman lapor, tanda terima, halaman status, papan info dengan jawaban tanya, antrean petugas, meja periksa dengan angka berbeda, dan state error. Kritik terhadap daftar larangan, perbaiki, lalu buang satu hiasan yang tidak perlu.
3. Standar minimum: responsif sampai 360 px, fokus keyboard terlihat, semua fungsi bisa dipakai dengan keyboard, kontras WCAG AA, `prefers-reduced-motion` dihormati, dan halaman korban tetap bisa dipakai pada throttling Slow 3G.

## 8. Data contoh (`data/demo/`)

Semua kejadian fiktif. Boleh memakai nama desa/kecamatan nyata di satu kabupaten di Provinsi Bengkulu agar pencocokan wilayah bisa diuji. Nama orang fiktif; nomor HP palsu berpola `0812-0000-xxxx`. Beri label jelas di UI dan README: "Contoh fiktif untuk demonstrasi."

- **12 laporan warga** dari formulir, tersebar di 4 desa:
  - 3 mendesak (orang terjebak, lansia tidak bisa keluar rumah, orang sakit butuh obat);
  - 2 laporan dari pelapor berbeda tentang desa yang sama dengan angka berbeda;
  - 1 laporan tampak iseng atau tidak terkait bencana;
  - 1 laporan hanya berisi tombol kebutuhan tanpa cerita;
  - singkatan dan salah ketik ("rmh", "sdh", "tdk", "kk"); kosakata Melayu Bengkulu hanya jika kamu yakin benar.
- **1 chat WhatsApp** format ekspor Android, 40–60 pesan, dari grup kepala desa: pesan yang mengulang info, angka berbeda untuk hal yang sama, pesan sistem, satu pesan terusan peringatan cuaca, dan pesan tidak relevan ("siap pak", stiker).
- **1 papan info terbit** untuk 2 desa: 2 lokasi pengungsian, titik air bersih, dapur umum, pos kesehatan, dan kontak posko (nomor contoh yang diberi label).

## 9. Kualitas kode

- Parser, penyamaran, aturan urgensi, verifikasi kutipan, pencocokan lokasi, pengelompokan, deteksi angka berbeda, penjaga angka, penjaga jawaban, transisi status, dan format pesan WhatsApp dibuat sebagai fungsi murni dengan unit test Vitest, termasuk kasus tepi.
- E2E Playwright untuk alur demo di Bagian 6.1, dan untuk cadangan WhatsApp saat jaringan dimatikan.
- GitHub Actions menjalankan lint, typecheck, test, dan build pada setiap push dan PR. Eval tidak dijalankan di CI karena memakan kuota.
- Tidak ada `any` tanpa alasan tertulis. Tidak ada kode mati atau berkas bawaan template.

## 10. Evaluasi akurasi (`eval/`)

- Kasus disimpan di `eval/cases/*.json`, dilabeli manusia. Kamu membuat skrip `npm run eval` dan 5 kasus contoh per jenis bertanda `"synthetic": true`; tim menambah kasus berlabel manual.
- Yang diukur:
  - Ekstraksi: presisi dan recall per field, serta jumlah klaim yang dibuang verifikasi kutipan.
  - Urgensi: recall kelas "tinggi" (paling penting, jangan sampai laporan mendesak terlewat) dan presisinya.
  - Tanya papan info: proporsi jawaban yang seluruhnya didukung papan info, dan proporsi "belum ada informasi resmi" yang memang benar.
- Hasil ditulis ke `eval/RESULTS.md` beserta tanggal, model, dan jumlah kasus. README dan halaman "Cara kerja" hanya mengutip angka dari file ini.

## 11. Fase kerja

Waktu sangat terbatas. Fase 0–5 wajib. Fase 6 hanya jika waktu tersisa dan saya setujui.

| Fase | Isi | Selesai jika |
|---|---|---|
| 0. Persiapan | Rencana desain kedua sisi disetujui; Next.js + TS strict + token Tailwind + ESLint/Prettier + Vitest; skema Supabase, RLS, migrasi; `.env.example`; CI; halaman kosong ter-deploy di Vercel | URL Vercel bisa dibuka, migrasi jalan, CI hijau |
| 1. Sisi korban tanpa AI | Halaman lapor, simpan laporan, kode dan tanda terima, halaman status, draf tersimpan di perangkat, cadangan WhatsApp | Laporan tersimpan dan status tampil; cadangan WhatsApp teruji dengan jaringan dimatikan |
| 2. AI laporan | Ekstraksi, aturan urgensi + usulan LLM, verifikasi kutipan, cache, fallback penyedia | Laporan tetap tersimpan dan berurgensi (dari aturan) saat AI dimatikan; unit test aturan urgensi lulus |
| 3. Sisi petugas | Login, antrean, tambah dari WhatsApp, meja periksa, ubah urgensi dan status, salin ringkasan | Status di halaman korban berubah saat petugas bertindak |
| 4. Papan info dan tanya | Formulir papan, usulan AI, terbitkan, riwayat versi, halaman publik, tanya dengan penjaga jawaban | Jawaban yang tidak didukung papan selalu diganti "belum ada informasi resmi" (ada test-nya) |
| 5. Demo dan rilis | Sesi demo, data contoh, retensi, rate limit, anggaran harian, `/api/health`, cron, aksesibilitas, uji Slow 3G, screenshot dan kritik desain, E2E, skrip eval, README, halaman Cara kerja dan Privasi | Alur demo kurang dari 2 menit lulus E2E, dan demo tetap jalan saat AI dimatikan |
| 6. Tambahan | Lihat Bagian 3 | Disetujui satu per satu |

## 12. README (isi minimum)

- Judul lengkap di baris pertama, lalu satu paragraf masalah dengan sumber, dari sudut pandang korban dan petugas.
- Cara mencoba dalam 2 menit: tautan live, lalu "Coba sebagai korban" dan "Coba sebagai petugas".
- Tangkapan layar kedua sisi dan diagram arsitektur (Mermaid).
- Cara AI dipakai, batasannya, aturan urgensi, dan hasil eval.
- Cara menjalankan lokal, daftar variabel lingkungan, dan cara membuat akun petugas.
- Keamanan, privasi, dan retensi data.
- Sumber data dan lisensi: data wilayah, BMKG (jika dipakai), font, library.
- Daftar tools dan model AI yang dipakai, baik dalam pengembangan (termasuk Claude Code) maupun di produk.
- Anggota tim dan perannya (diisi tim).
