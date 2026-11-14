# Progres Testara

Diperbarui di akhir sesi mode otonom, 15 November 2026. Batas pengumpulan: 20 November 2026 pukul 23.59 WIB.

## Fase selesai (semua masih lokal, belum di-push)

- **Fase 0. Persiapan**: Next.js 16.4 + TS strict + Tailwind dengan token sendiri + ESLint/Prettier + Vitest + Playwright, skema Supabase + RLS (`supabase/migrations/`), `.env.example`, CI GitHub Actions, rencana desain (`docs/DESIGN.md`), keputusan (`docs/DECISIONS.md`), data wilayah Bengkulu (MIT).
- **Fase 1. Sisi korban tanpa AI**: halaman lapor, simpan laporan, kode dan tanda terima, halaman status dengan linimasa, draf di perangkat, cadangan WhatsApp saat sinyal jelek. Formulir juga bekerja tanpa JavaScript.
- **Fase 2. AI laporan**: Groq `openai/gpt-oss-120b` + cadangan Gemini `gemini-3.5-flash-lite`, cache, anggaran harian, fallback, validasi Zod dengan satu kali ulang, verifikasi kutipan, penjaga angka, aturan urgensi.
- **Fase 3. Sisi petugas**: masuk petugas (Supabase Auth) dan petugas demo satu klik, antrean, tambah dari WhatsApp, meja periksa dengan angka berbeda, salin ringkasan WhatsApp.
- **Fase 4. Papan info dan tanya**: penyunting papan, usulan dari laporan resmi, terbitkan dengan riwayat versi, halaman publik, tanya dengan penjaga jawaban.
- **Fase 5. Demo dan rilis**: sesi demo dengan 12 laporan contoh dan papan 2 desa, contoh chat WhatsApp, retensi harian (`/api/cron/retensi` + workflow), batas laju, anggaran, `/api/health`, uji Slow 3G dan tanpa JS, screenshot 375/1440 dan kritik desain, E2E alur demo juri, skrip eval, README, halaman Cara kerja dan Privasi.

Hasil gerbang terakhir: `prettier --check` bersih, `lint` bersih, `typecheck` bersih, 138 unit test lulus, `build` lulus, 15 E2E lulus (alur demo juri selesai sekitar 4 detik dengan AI mati).

## Sedang dikerjakan

Tidak ada. Fase 6 tidak dimulai (sesuai Bagian 0A).

## Langkah berikutnya

1. Selesaikan "Butuh tindakan saya" di bawah (urut sesuai nomor).
2. Setelah kunci AI ada: `npm run demo:generate`, `npm run eval`, commit `data/demo/ai-results.json` dan `eval/RESULTS.md`, lalu tambahkan kasus eval berlabel manual di `eval/cases/`.
3. Uji langsung di URL produksi: alur demo, `/api/health` (harus `"storage": "supabase"`), dan satu pertanyaan tanya papan info dengan AI menyala.

## Butuh tindakan saya

1. **Repo GitHub dan push.** Repo lokal tidak punya remote. Saya mencoba `gh repo create ItsBayyyy/testara --private ...`, tapi perintah itu ditolak pengaman mode otomatis Claude Code, dan saya tidak mencoba jalan lain. Semua commit ada di branch lokal `main`. Jalankan:
   ```bash
   gh repo create ItsBayyyy/testara --private --source=. --remote=origin --push
   ```
   Lomba mewajibkan repo **publik**; ubah visibilitas sebelum 20 November.
2. **Vercel.** Import repo di Vercel (Next.js terdeteksi otomatis), isi variabel lingkungan dari `.env.example`, deploy. Isi tautan live di README bagian "Coba dalam 2 menit".
3. **Supabase.** Akun Anda sudah punya dua proyek free tier, jadi saya tidak membuat proyek baru. Buat proyek baru (atau pakai yang ada), jalankan `supabase/migrations/20261115000000_init.sql`, isi `SUPABASE_URL`, `SUPABASE_ANON_KEY` (kunci `sb_publishable_...`), `SUPABASE_SERVICE_ROLE_KEY` (kunci `sb_secret_...`). Tanpa ini aplikasi memakai penyimpanan memori yang **tidak andal di Vercel** (data bisa hilang antar permintaan).
4. **Kunci AI**: `GROQ_API_KEY` dan `GEMINI_API_KEY` di `.env.local` dan Vercel. Lalu langkah 2 di "Langkah berikutnya".
5. **Rahasia lain**: `IP_HASH_SALT` dan `CRON_SECRET` (string acak panjang) di Vercel; secret repo GitHub `APP_URL` dan `CRON_SECRET` untuk workflow retensi.
6. **Akun petugas** untuk uji masuk sungguhan: buat di Supabase Dashboard lalu `insert into public.staff ...` (lihat README). Alur masuk petugas sungguhan belum pernah diuji karena belum ada proyek Supabase.
7. **README**: isi bagian Tim dan tautan live.

## Perlu ditinjau

- **Belum pernah ada panggilan AI sungguhan.** Prompt, skema strict Groq, dan format `responseJsonSchema` Gemini ditulis dari dokumentasi resmi (dicek 15 Nov 2026), tapi baru diuji dengan penyedia palsu. Dokumentasi Gemini menyebut dua nama field structured output; jika Gemini menolak, cek `src/lib/ai/providers/gemini.ts`.
- **Demo tanpa hasil AI**: 12 laporan contoh tampil "belum dirapikan AI", dan meja periksa demo belum menampilkan angka berbeda sampai `npm run demo:generate` dijalankan (D14).
- **TPM Groq free tier 8K**: batch WhatsApp 18 pesan bisa mendekati batas; saat 429, sistem pindah ke Gemini. Jika sering terjadi, turunkan ukuran batch di `src/lib/whatsapp/parse.ts` (`toBatches`).
- Rencana desain dan palet: `docs/DESIGN.md`, termasuk tabel kritik setelah screenshot.
- Kabupaten demo Bengkulu Tengah (`REGENCY_CODE=17.09`), D5.
- Cache Components Next.js dimatikan, D1.
- Formulir lapor dibuat bisa jalan tanpa JavaScript, D11.
- Desa tidak wajib di formulir; jika kosong, cerita wajib, D17.
- `CLAUDE.md` dan `.claude/settings.json` ikut di-commit (brief proyek dan aturan izin). Hapus dari repo sebelum dipublikasikan jika tidak ingin terlihat juri.
