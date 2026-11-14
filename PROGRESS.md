# Progres Testara

Diperbarui otomatis selama mode otonom. Waktu: 15 November 2026.

## Fase selesai

- **Fase 0. Persiapan** (lokal): Next.js 16 + TS strict + Tailwind token sendiri + ESLint/Prettier + Vitest + Playwright, skema Supabase + RLS (`supabase/migrations/`), `.env.example`, CI GitHub Actions, rencana desain (`docs/DESIGN.md`), keputusan (`docs/DECISIONS.md`), data wilayah Bengkulu.
- **Fase 1. Sisi korban tanpa AI** (lokal): halaman lapor, simpan laporan, kode dan tanda terima, halaman status dengan linimasa, draf di perangkat, cadangan WhatsApp. E2E lulus termasuk skenario jaringan dimatikan.

- **Fase 2. AI laporan** (lokal): penyedia Groq (`openai/gpt-oss-120b`) dan Gemini (`gemini-3.5-flash-lite`) di balik `AIProvider`, cache sha256, anggaran harian, fallback otomatis saat 429/5xx/timeout, validasi Zod dengan satu kali ulang, verifikasi kutipan, penjaga angka ringkasan, aturan urgensi. Belum pernah diuji dengan panggilan AI sungguhan karena kunci belum ada; perilaku diuji dengan penyedia palsu di unit test.

## Sedang dikerjakan

- Fase 3. Sisi petugas.

## Langkah berikutnya

Fase 2 sampai 5 sesuai CLAUDE.md Bagian 11.

## Butuh tindakan saya

1. **Repo GitHub belum ada, jadi belum ada push dan belum ada deploy Vercel.** Saat mulai, repo lokal tidak punya remote. Saya mencoba membuat repo privat `ItsBayyyy/testara` dengan `gh repo create`, tapi perintah itu ditolak oleh pengaman mode otomatis Claude Code (dianggap komunikasi keluar yang tidak diizinkan). Saya tidak mencoba jalan lain. Semua commit ada di branch lokal `main`. Langkah untuk Anda:
   ```bash
   gh repo create ItsBayyyy/testara --private --source=. --remote=origin --push
   ```
   Lalu di Vercel: Import Project dari repo itu (framework Next.js terdeteksi otomatis), isi variabel lingkungan dari `.env.example`. Lomba mewajibkan repo **publik** sebelum 20 November.
2. **Proyek Supabase belum ada.** Akun Supabase Anda sudah punya dua proyek free tier (`Bot Wa`, `aplikasi keuangan`), dan saya tidak membuat proyek baru karena itu mengubah akun Anda dan bisa melewati batas free tier. Tanpa Supabase, aplikasi memakai penyimpanan memori (data hilang saat server mulai ulang; `/api/health` menampilkan `"storage": "memori"`). Langkah:
   - Buat proyek Supabase baru (region Singapura/Tokyo), lalu jalankan `supabase/migrations/20261115000000_init.sql` di SQL Editor atau `supabase db push`.
   - Isi `SUPABASE_URL`, `SUPABASE_ANON_KEY` (kunci publishable `sb_publishable_...`), `SUPABASE_SERVICE_ROLE_KEY` (kunci secret `sb_secret_...`). Lihat `docs/DECISIONS.md` D6.
3. **Kunci AI belum ada** (`GROQ_API_KEY`, `GEMINI_API_KEY`). Tanpa kunci, laporan tetap tersimpan dengan urgensi dari aturan dan label "belum dirapikan AI".

## Perlu ditinjau

- Rencana desain dan palet: `docs/DESIGN.md` (saya memutuskan sendiri sesuai Bagian 7).
- Kabupaten demo: Bengkulu Tengah (`REGENCY_CODE=17.09`), lihat `docs/DECISIONS.md` D5.
- Cache Components Next.js dimatikan (D1).
- Desa di formulir lapor tidak wajib: jika desa tidak ditemukan, cerita wajib diisi supaya lokasinya tetap tertulis.
