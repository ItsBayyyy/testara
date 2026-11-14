# Keputusan teknis dan desain

Dicatat selama mode otonom. Format: keputusan, alasan, dan cara membatalkannya jika perlu.

## Fase 0

### D1. Cache Components Next.js dimatikan

`create-next-app` 16.4 menyalakan `cacheComponents` dan `partialPrefetching`. Hampir semua halaman Testara membaca data per permintaan (status laporan, antrean, papan info, cookie demo), sehingga prerender statis tidak memberi manfaat, sementara mode itu mewajibkan pembungkus `<Suspense>` di setiap akses data dinamis. Dimatikan untuk mengurangi risiko. Membatalkan: set `cacheComponents: true` dan `partialPrefetching: true` di `next.config.ts`, lalu bungkus akses `cookies()` dengan `<Suspense>`.

### D2. Kode di `src/`

Mengikuti struktur folder di brief (`src/app`, `src/lib`, ...). Alias `@/*` menunjuk `src/*`.

### D3. Penyimpanan dengan dua implementasi

`src/lib/db/store.ts` mendefinisikan antarmuka `Store`. Ada `SupabaseStore` (dipakai jika `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` ada) dan `MemoryStore` (memori proses). Alasan: kunci Supabase belum tersedia saat dibangun, dan test E2E butuh penyimpanan yang bisa berjalan tanpa jaringan. `/api/health` menyebut mana yang aktif (`storage: "supabase" | "memori"`). **Penyimpanan memori tidak cocok untuk produksi**: data hilang saat fungsi serverless dimulai ulang.

### D4. Semua akses data lewat server dengan kunci service role

Sesuai brief: publik tidak menyentuh tabel. RLS tetap aktif sebagai lapisan kedua (tanpa policy untuk `anon`; petugas login hanya bisa membaca data kabupatennya). Setiap query membawa lingkup `{ demoSessionId, regencyCode }` secara eksplisit sehingga data demo dan data sungguhan tidak pernah tercampur.

### D5. Satu kabupaten per deployment

Variabel `REGENCY_CODE` (bawaan `17.09`, Kabupaten Bengkulu Tengah). Data wilayah: `data/wilayah/bengkulu.json` dari `cahyadsn/wilayah` (MIT), lihat `data/wilayah/SOURCE.md`. Bengkulu Tengah dipilih karena wilayah rawan banjir dan longsor dengan 11 kecamatan dan 143 desa/kelurahan, cukup kecil untuk dimuat utuh di halaman lapor.

### D6. Nama variabel lingkungan Supabase

Brief memakai `SUPABASE_ANON_KEY` dan `SUPABASE_SERVICE_ROLE_KEY`. Dokumentasi Supabase (dicek 15 Nov 2026) menyebut kunci lama `anon`/`service_role` sedang dihentikan menjelang akhir 2026 dan diganti kunci `sb_publishable_...` dan `sb_secret_...`. Nama variabel tetap mengikuti brief, tapi **isi dengan kunci baru**: publishable ke `SUPABASE_ANON_KEY`, secret ke `SUPABASE_SERVICE_ROLE_KEY`. Keduanya dipakai di slot yang sama pada `createClient`.

### D7. Model AI (dicek di dokumentasi resmi, 15 Nov 2026)

- Utama: Groq `openai/gpt-oss-120b`, endpoint `https://api.groq.com/openai/v1/chat/completions`, `response_format: json_schema` dengan `strict: true` (semua properti wajib ada di `required`, `additionalProperties: false`, nilai opsional memakai tipe `["string","null"]`). `reasoning_effort: "low"` dan `include_reasoning: false` agar cepat dan keluaran bersih. Batas free tier: 30 RPM, 1K RPD, 8K TPM, 200K TPD. TPM 8K adalah hambatan utama, karena itu batch WhatsApp 18 pesan.
- Cadangan: Google Gemini `gemini-3.5-flash-lite` (stabil), `generateContent` dengan `responseMimeType: "application/json"` dan `responseJsonSchema`. Dapat diganti lewat `GEMINI_MODEL`. Di free tier, prompt dapat dipakai Google dan dibaca peninjau manusia, jadi hanya teks yang sudah disamarkan yang dikirim (nomor HP tidak pernah dikirim ke AI mana pun).
- Semua keluaran tetap divalidasi Zod dan diulang sekali dengan pesan error jika gagal.

### D8. Font

Atkinson Hyperlegible Next (variabel, mendukung `tnum`) dan Atkinson Hyperlegible Mono (khusus kode laporan dan kolom angka), lewat `next/font/google` sehingga di-host sendiri. `adjustFontFallback` dimatikan karena next/font tidak punya metrik fallback untuk keluarga ini.

### D9. Palet Tailwind bawaan dimatikan

`--color-*: initial` di `@theme`, sehingga kelas seperti `bg-blue-500` tidak tersedia. Hanya token Testara yang bisa dipakai.

### D10. Repo GitHub dibuat **privat**

Tidak ada remote saat mulai. Agar bisa "push ke main", repo `testara` dibuat di akun GitHub yang sudah login dengan visibilitas **privat**, karena membuat kode publik adalah keputusan Anda. Lomba mewajibkan repo publik: ubah visibilitas sebelum pengumpulan (lihat PROGRESS.md).

## Fase 1 sampai 5

### D11. Formulir lapor tanpa ketergantungan JavaScript

Uji Slow 3G menunjukkan formulir bisa dikirim sebelum JavaScript termuat, dan isian hilang. Formulir sekarang berupa `<form method="post" action="/api/reports/form">` biasa yang diperkaya JS: tombol kebutuhan adalah checkbox asli bergaya kartu, isian tidak dikendalikan React (teks yang diketik sebelum hidrasi tidak terhapus), dan desa yang hanya diketik dicocokkan di server. Tanpa JS, perapian AI dijalankan lewat `after()` di server.

### D12. Petugas demo tanpa kata sandi

Masuk petugas demo hanya menyalakan cookie `demo_petugas` di dalam sesi demo. Lingkup datanya diambil dari sesi demo itu, jadi tidak pernah bisa melihat data sungguhan. Petugas sungguhan selalu memakai lingkup data sungguhan, walau perangkatnya punya cookie demo.

### D13. Status laporan dan linimasa

Petugas bisa langsung memilih "Masuk laporan resmi" atau "Perlu konfirmasi" dari "Diterima"; linimasa korban tetap mencatat "Dibaca petugas" lebih dulu karena status akhir mustahil tanpa dibaca. "Resmi" dan "Perlu konfirmasi" boleh saling berganti.

### D14. Hasil AI data contoh belum ada

CLAUDE.md melarang membuat hasil AI tanpa memanggil AI. Kunci AI belum tersedia, jadi `data/demo/ai-results.json` masih kosong dan 12 laporan contoh tampil "belum dirapikan AI". Akibatnya meja periksa demo belum menampilkan angka berbeda. Setelah kunci diisi, jalankan `npm run demo:generate` dan commit hasilnya.

### D15. Contoh chat WhatsApp di `public/contoh/`

Contoh ekspor grup WhatsApp disajikan sebagai berkas statis supaya juri bisa memakainya dengan satu tombol di mode demo atau mengunduhnya. Baris pertama berkas menandainya sebagai contoh fiktif (baris sebelum pesan pertama diabaikan parser).

### D16. Batas laju di E2E

Setiap tes E2E memakai header `x-forwarded-for` acak agar batas 5 laporan per jam tidak saling memengaruhi. Di Vercel, header itu diisi oleh platform, bukan oleh klien.

### D17. Desa pada laporan

Desa tidak wajib dipilih di formulir. Jika tidak dipilih, cerita wajib diisi (lokasinya tertulis di sana), AI mencoba mencocokkan lokasi, dan petugas bisa menetapkan desa di detail laporan.
