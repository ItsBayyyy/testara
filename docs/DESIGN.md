# Rencana desain Testara

Diputuskan dalam mode otonom (CLAUDE.md Bagian 0A dan 7). Silakan tinjau; semua nilai ada di satu tempat (`src/app/globals.css`) sehingga mudah diubah.

## Prinsip

1. **Dua wajah, satu identitas.** Sisi korban lapang dan tenang; sisi petugas padat seperti meja kerja. Token warna, huruf, dan nada bahasa sama.
2. **Satu tugas per layar untuk korban.** Halaman lapor adalah satu kolom, urutan pertanyaan mengikuti cara orang bercerita: di mana, butuh apa, siapa yang perlu didahulukan, ceritanya.
3. **Keberanian visual hanya di tanda terima.** Kode laporan besar, kalimat penenang, linimasa status. Elemen lain tenang.
4. **Oranye berarti "perlu tindakan".** Tidak dipakai untuk hiasan. Stabilo kuning hanya untuk kutipan sumber.
5. **Ringan.** Halaman korban tanpa library UI, tanpa gambar, satu keluarga huruf.

## Palet

| Token | Hex | Peran | Kontras |
|---|---|---|---|
| `bg` | `#F3F5F4` | latar halaman | |
| `surface` | `#FFFFFF` | panel, kolom isian | |
| `ink` | `#1B2A3A` | teks utama, tombol utama | 14,6:1 di `surface`, 13,4:1 di `bg` |
| `ink-2` | `#566573` | teks sekunder | 6,0:1 di `surface`, 5,5:1 di `bg` |
| `line` | `#C9D1CD` | pemisah 1 px, bingkai isian | (non-teks) |
| `line-strong` | `#7A8890` | bingkai isian dan checkbox | 3,6:1 di `surface` (komponen UI, min. 3:1) |
| `action` | `#E8620C` | penanda urgensi tinggi, angka berbeda, belum diperiksa (garis, titik, bingkai) | 3,4:1 (non-teks, min. 3:1) |
| `action-ink` | `#A84505` | teks oranye | 6,0:1 di `surface`, 5,2:1 di `action-wash` |
| `action-wash` | `#FDEBDD` | latar tipis baris mendesak | |
| `mark` | `#FFE14D` | stabilo kutipan sumber | teks `ink` di atasnya 11,2:1 |
| `done` | `#2E7D4F` | selesai/terkonfirmasi | 5,1:1 di `surface`; tidak dipakai sebagai teks di atas `done-wash` (4,3:1) |
| `done-wash` | `#E3F1E8` | latar tipis langkah selesai | |
| `focus` | `#1F5FBF` | cincin fokus 3 px | 6,1:1 di `surface` |

Perubahan dari token awal: menambah `line`, `line-strong`, `action-ink`, `action-wash`, `done-wash`, dan `focus`. Alasan: `#E8620C` sebagai teks hanya 3,4:1 sehingga butuh varian gelap; cincin fokus perlu warna yang tidak bentrok dengan oranye (urgensi) maupun hijau (selesai).

## Tipografi

- **Atkinson Hyperlegible Next** untuk seluruh UI lewat `next/font/google` (di-host sendiri saat build, tanpa permintaan ke Google saat runtime). Alasan: 1/l/I dan 0/O mudah dibedakan, penting untuk kode laporan dan angka korban.
- **Atkinson Hyperlegible Mono** hanya untuk kode laporan dan kolom angka di meja periksa, karena kode seperti `TS-7K4Q-9M2X` harus bisa disalin dengan tepat. Angka lain memakai `font-variant-numeric: tabular-nums`.
- Skala (sisi korban): teks dasar 18 px (minimal 17 px sesuai brief), judul halaman 28 px, judul bagian 20 px, kode laporan 40 px. Sisi petugas: teks dasar 16 px, tabel 15 px.
- Huruf kalimat biasa di semua label. Tanpa huruf kapital berjarak lebar.

## Bentuk dan ruang

- Radius berhierarki: tombol kebutuhan korban 12 px (besar dan berisi), kolom isian 8 px, panel tanda terima 16 px, panel petugas 0 px dengan pemisah 1 px.
- Target sentuh minimal 48 px di sisi korban; tombol kebutuhan 64 px.
- Bayangan hanya untuk elemen melayang (notifikasi "Kode disalin"). Tidak ada bayangan pada kartu.
- Gerak: hanya sapuan stabilo 200 ms dan perpindahan langkah linimasa; keduanya mati jika `prefers-reduced-motion`.

## Wireframe

### Korban, mobile: halaman lapor

```
+----------------------------------+
| Testara               Papan info |
+----------------------------------+
| Ada yang terancam nyawanya?      |   <- pita bergaris kiri oranye
| Telepon 112 sekarang.            |      tombol "Telepon 112"
+----------------------------------+
| Lapor kejadian                   |   <- h1
|                                  |
| Desa Anda                        |
| [ Cari desa...               ]   |   <- daftar saran di bawahnya
|                                  |
| Apa yang dibutuhkan?             |
| [ Evakuasi ]   [ Air bersih ]    |   <- tombol toggle 64 px
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
| Petunjuk: tekan ikon mikrofon    |
| di keyboard untuk bicara.        |
|                                  |
| (o) Untuk saya  ( ) Orang lain   |
| Nomor HP (tidak wajib) [       ] |
| [x] Saya setuju laporan disimpan |
|                                  |
| [        Kirim laporan       ]   |
| Draf tersimpan di HP ini.        |
+----------------------------------+
```

### Korban, mobile: tanda terima (elemen yang diingat)

```
+----------------------------------+
| Testara               Papan info |
+----------------------------------+
| Laporan Anda sudah kami terima.  |   <- h1, 28 px
| Simpan kode ini untuk melihat    |
| perkembangannya.                 |
|                                  |
| +------------------------------+ |
| |  TS-7K4Q-9M2X                | |   <- 40 px mono, panel putih radius 16
| |  [ Salin kode ]              | |
| +------------------------------+ |
|                                  |
| (*) Diterima        21.10        |   <- linimasa vertikal, titik hijau
|  |                               |
| ( ) Dibaca petugas               |
|  |                               |
| ( ) Masuk laporan resmi          |
|     atau perlu konfirmasi        |
|                                  |
| Status ini menunjukkan laporan   |
| Anda sudah diproses petugas,     |
| bukan jaminan waktu kedatangan   |
| bantuan.                         |
|                                  |
| [ Lihat papan info Desa X ]      |
+----------------------------------+
```

### Korban, mobile: papan info desa

```
+----------------------------------+
| Testara               Papan info |
+----------------------------------+
| Papan info Desa X                |
| Diperbarui 21.40, 14 Nov         |
| [ Bagikan ke WhatsApp ]          |
|                                  |
| Tanya papan info                 |
| [ Di mana ambil air bersih? ] [>]|
| Jawaban ... (dari: Titik air 1)  |
|                                  |
| Pengungsian                      |
|  Balai Desa X - jl. ...          |
| Titik bantuan                    |
|  Air bersih - ...                |
| Kebutuhan diumumkan              |
| Kontak posko                     |
+----------------------------------+
```

### Petugas, desktop: antrean

```
+---------------------------------------------------------------------+
| Testara  Petugas    Antrean   Tambah WA   Kejadian   Papan    Keluar |
+---------------------------+-----------------------------------------+
| Antrean (14)  [desa v][st]| Laporan TS-7K4Q-9M2X                    |
|                           | Desa X, 21.10, dari formulir            |
| Mendesak (3)              | Dirapikan otomatis. Periksa sebelum     |
| | Desa X  evakuasi, lansia|  ditindaklanjuti.                       |
| | Desa Y  terjebak        | Kebutuhan: evakuasi, obat               |
| Lainnya (11)              | Didahulukan: lansia                     |
|   Desa Z  air bersih      | Urgensi tinggi karena: "nenek tdk bisa  |
|   ...                     |  keluar rmh" (aturan + AI)              |
|                           | Cerita: ... [kutipan tersorot] ...      |
|                           | [Tandai dibaca] [Masuk laporan resmi]   |
|                           | [Perlu konfirmasi]  Urgensi [v]         |
+---------------------------+-----------------------------------------+
```

Baris mendesak ditandai garis kiri oranye 4 px, bukan latar merah.

### Petugas, mobile

Antrean dan detail jadi dua langkah: daftar (`/petugas`) lalu detail (`/petugas?laporan=<id>`) dengan tautan "Kembali ke antrean" di atas.

### Petugas, desktop: meja periksa kejadian

```
+---------------------------------------------------------------------+
| Kejadian: Banjir, Desa X              5 laporan, 2 angka berbeda    |
+-------------------------------+-------------------------------------+
| Angka                         | Pesan sumber                        |
| Mengungsi (KK)                | 21.02 WhatsApp                      |
|  ! 12 (2 pelapor)  [pilih]    |  "...sdh [12 kk] ngungsi di..."     |
|  ! 15 (1 pelapor)  [pilih]    | 21.15 Formulir                      |
| Rumah terendam   30           |  "...kira2 [15 kk] di balai..."     |
| Meninggal        tidak disebut|                                     |
|                [Simpan pilihan]                                     |
+-------------------------------+-------------------------------------+
```

Klik angka: panel kanan menggulir ke pesan dan kutipan diberi sapuan stabilo.

## Cek terhadap daftar larangan

| Larangan | Status |
|---|---|
| Krem hangat + serif + terakota; latar hampir hitam + neon; gaya koran | Tidak dipakai. Latar abu dingin, satu sans, aksen oranye fungsional. |
| Kartu membulat identik, radius seragam, bayangan tipis seragam, gradien, glass, blob | Radius berhierarki, panel petugas tanpa radius, bayangan hanya untuk toast. |
| Label kapital berjarak lebar, meta "A · B · C", "KATA — penggalan", panah di tombol, mono dekoratif | Meta ditulis dengan koma. Mono hanya untuk kode dan angka. Tidak ada panah. |
| Satu kata di judul diberi gaya berbeda | Tidak ada. |
| Penanda 01/02/03 non-urutan | Hanya linimasa status, yang memang berurutan, dan tanpa nomor. |
| Sparkle, "Powered by AI", emoji | Label AI berupa kalimat biasa: "Dirapikan otomatis. Periksa sebelum ditindaklanjuti." |
| Ilustrasi bencana, merah alarm, hitung mundur | Tidak ada gambar. Merah tidak dipakai; urgensi oranye sebagai garis. |
| Hero pemasaran, grid tiga kartu, testimoni/logo/statistik palsu | Beranda berisi tombol utama, tautan papan info, pita demo. Statistik hanya dua fakta bersumber di "Cara kerja". |
| Animasi scroll, hover membesar | Tidak ada. Hover hanya ganti warna latar/garis. |
| Inter/Poppins/dst, palet bawaan Tailwind | Atkinson Hyperlegible; warna hanya dari token `@theme` sendiri. |
| shadcn bawaan | Tidak memakai shadcn. Komponen ditulis sendiri. |
| Kata promosi | Dicek di salinan UI. |

## Yang saya ubah setelah cek

- Rencana awal memberi beranda tiga blok berdampingan (lapor, papan info, status). Itu mendekati "grid tiga kartu", jadi diganti satu tombol utama besar dan dua tautan teks di bawahnya.
- Rencana awal memakai latar oranye penuh untuk pita "terancam nyawa". Terlalu memicu panik; diganti panel putih dengan garis kiri oranye dan tombol telepon berwarna tinta.
