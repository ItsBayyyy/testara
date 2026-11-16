# Desain Testara: karcis dan papan tulis posko

Arah ini dipilih pada 16 November 2026 dan menggantikan semua arahan desain sebelumnya. Audit,
dua arah yang dibandingkan, dan screenshot sebelum/sesudah ada di
[`docs/design-audit/`](design-audit/AUDIT.md). Semua token ada di satu tempat:
[`src/app/globals.css`](../src/app/globals.css).

## Revisi 16 November 2026: lebih sedikit teks, lebih bersih

Masukan: tampilan terasa terlalu banyak teks dan mirip situs berita. Perubahan:

- **Halaman putih tanpa lembar.** Latar papan (`bg`) kini hanya untuk karcis, pita demo, dan
  pemberitahuan. Kelas `.sheet` dihapus; bagian dipisah dengan ruang saja.
- **Judul lebih ringan**: berat 600 (bukan 700), label 600.
- **Teks dipangkas** di semua halaman korban: subjudul beranda dan lapor, petunjuk "Boleh pilih
  lebih dari satu", petunjuk cari desa, keterangan di bawah tombol kirim, paragraf penjelas papan
  info, dan teks pengantar halaman petugas. Persetujuan, ajakan menelepon 112, kalimat "bukan
  jaminan waktu kedatangan bantuan", dan label AI tetap ada, tapi lebih pendek atau lebih kecil.
- **Ajakan darurat** jadi satu baris: "Nyawa terancam?" + tombol "Telepon 112".
- **Beranda**: judul, satu baris keterangan, tombol utama, ajakan darurat, lalu dua tombol
  sekunder (Papan info, Cek status). Daftar tautan bergaris bawah dengan deskripsi dihapus.
- **Pita demo** jadi satu baris tautan kecil berlatar papan.
- **Papan info**: bagian kosong disembunyikan (kecuali kontak posko), stempel pembaruan digabung
  ke baris kecamatan, petunjuk di kotak tanya dihapus.
- **Status**: rincian berupa satu baris kecil di bawah linimasa, bukan daftar berjudul.
- **Footer**: tiga tautan (Cara kerja, Privasi, Masuk petugas).

Bagian di bawah ini tetap berlaku, kecuali hal yang disebut di atas.

## Konsep

Setiap laporan adalah **karcis** yang disobek dari blok posko, dan setiap papan info adalah
**papan tulis** yang ditulisi petugas. Korban mengenal karcis dari antrean puskesmas, bank, dan
posko: "saya sudah dapat nomor, tinggal menunggu." Petugas mengenal papan tulis posko sebagai
tempat angka ditulis, dicoret, dan ditandai stabilo.

## Prinsip

1. **Satu aksi utama per layar**, berwarna spidol biru penuh. Aksi lain bergaris tinta atau
   bergaris bawah.
2. **Bagian dipisah dengan ruang.** Halaman berlatar papan; isi utama di atas satu lembar putih.
   Tidak ada kotak di dalam kotak, kecuali isian dan pemberitahuan yang memang meminta perhatian.
3. **Setiap warna aksen punya satu makna** dan tidak pernah jadi satu-satunya penanda.
4. **Karcis adalah satu-satunya elemen berani.** Tepi sobeknya adalah satu-satunya hiasan bentuk.

## Token

### Warna

| Token                    | Hex       | Satu makna                                                      | Kontras                                |
| ------------------------ | --------- | --------------------------------------------------------------- | -------------------------------------- |
| `bg` (papan)             | `#EDF0EE` | latar halaman                                                   |                                        |
| `surface` (kertas)       | `#FFFFFF` | lembar dan karcis                                               |                                        |
| `ink`                    | `#17212B` | teks; blok ajakan menelepon 112                                 | 16,3:1 di putih, 14,2:1 di papan       |
| `ink-2`                  | `#55606B` | teks sekunder                                                   | 6,4:1 di putih, 5,6:1 di papan         |
| `line`                   | `#D5DBD8` | pemisah tabel dan daftar                                        | non-teks                               |
| `line-strong`            | `#7A8890` | bingkai isian, kotak centang                                    | 3,6:1 di putih (komponen UI, min. 3:1) |
| `spidol`                 | `#1E4BA0` | aksi utama dan pilihan terpilih                                 | putih di atasnya 8,2:1                 |
| `spidol-wash`            | `#E7EDF8` | latar pilihan terpilih                                          | tinta di atasnya 13,9:1                |
| `action` (spidol oranye) | `#B0450F` | perlu tindakan: mendesak, angka berbeda, belum diperiksa, error | 5,7:1 di putih, 4,9:1 di `action-wash` |
| `action-wash`            | `#FBEBE1` | latar pemberitahuan perlu tindakan                              |                                        |
| `mark` (stabilo)         | `#FFE14D` | kutipan sumber                                                  | tinta di atasnya 12,5:1                |
| `done`                   | `#23704A` | langkah linimasa yang sudah terjadi                             | 6,0:1 di putih                         |

Palet bawaan Tailwind dimatikan (`--color-*: initial`).

### Tipografi

- **Atkinson Hyperlegible Next** untuk semua teks: judul 700, isi 400. Huruf ini dirancang agar
  1/l/I dan 0/O mudah dibedakan, penting untuk korban lansia dan angka korban yang dibaca petugas
  yang lelah. Satu keluarga juga menjaga halaman korban tetap ringan.
- **Atkinson Hyperlegible Mono** hanya untuk kode laporan, karena karcis memang dicetak dengan
  huruf berjarak sama dan kode harus disalin tepat. Angka lain memakai `tabular-nums`.
- **Lima ukuran saja** (`--text-*: initial`):

  | Token       | Ukuran                           | Peran                                   |
  | ----------- | -------------------------------- | --------------------------------------- |
  | `text-sm`   | 15 px                            | meta, petunjuk; teks dasar sisi petugas |
  | `text-base` | 17 px                            | teks dasar sisi korban                  |
  | `text-lg`   | 20 px                            | judul bagian                            |
  | `text-xl`   | 26 px                            | judul halaman                           |
  | `text-code` | 32-40 px (mengikuti lebar layar) | kode laporan di karcis                  |

### Jarak, radius, bayangan

- Jarak memakai skala Tailwind kelipatan 4 px; nilai setengah (`py-1.5` dan sejenisnya) dihapus.
- Kolom isi sisi korban maksimal 560 px; panjang baris paragraf maksimal 68 karakter.
- Radius per peran: lembar 4 px (`--radius-sheet`), tombol dan isian 6 px (`--radius-control`),
  karcis tegak dengan tepi sobek.
- Bayangan hanya untuk elemen yang melayang (`--shadow-float`); saat ini tidak ada yang memakainya.

## Komponen dan state

| Komponen              | Normal                                                                                       | Hover         | Fokus                  | Aktif                                                                             | Nonaktif                             | Memuat                                     |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------- | ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------------------ |
| `.btn-primary`        | spidol, teks putih                                                                           | spidol gelap  | cincin tinta 3 px      | tinta                                                                             | latar papan, teks abu, bingkai garis | spidol gelap + putaran 16 px (`aria-busy`) |
| `.btn-secondary`      | putih, bingkai tinta 2 px                                                                    | latar papan   | cincin tinta           | latar garis                                                                       | sama                                 | sama                                       |
| `.btn-quiet`          | teks bergaris bawah                                                                          | latar papan   | cincin tinta           | latar garis                                                                       | sama                                 |                                            |
| `.field`              | bingkai 1,5 px `line-strong`                                                                 | bingkai tinta | bingkai tinta + cincin |                                                                                   | latar papan                          |                                            |
| `.choice` (kebutuhan) | putih, kotak centang kosong                                                                  | bingkai tinta | cincin tinta           | **centang putih di kotak spidol + garis tepi tebal spidol** + latar `spidol-wash` |                                      |                                            |
| `.tag-action`         | teks oranye + kotak oranye 8 px + bingkai                                                    |               |                        |                                                                                   |                                      |                                            |
| `.ticket`             | kepala spidol 8 px, tepi bawah sobek                                                         |               |                        |                                                                                   |                                      |                                            |
| Linimasa              | sudah: lingkaran hijau bercentang + jam; berikutnya: lingkaran bergaris + "Menunggu petugas" |               |                        |                                                                                   |                                      |                                            |

Putaran memuat diam jika `prefers-reduced-motion`. Gerak lain hanya sapuan stabilo 200 ms.

## Keputusan per halaman

- **Beranda**: pita mode demo selebar layar di paling atas, satu lembar dengan judul dan tombol
  utama, blok tinta "Ada yang terancam nyawanya?", lalu dua tautan.
- **Lapor**: blok tinta ajakan 112 paling atas, satu lembar formulir, kartu kebutuhan bercentang.
  Ringkasan error hilang per baris begitu isian diperbaiki.
- **Tanda terima dan status**: karcis berkepala biru dengan kode besar, "Salin kode", dan tautan
  halaman status; linimasa dan kalimat "bukan jaminan waktu kedatangan bantuan" (tebal) di lembar
  di bawahnya.
- **Papan info**: stempel "Diperbarui petugas" di bawah judul, kotak tanya di lembar sendiri.
  Jawaban yang didukung bergaris spidol; "Belum ada informasi resmi untuk itu" berjudul besar
  dengan garis tinta dan kontak posko.
- **Antrean**: kolom kiri seperti tabel kerja: penanda "Mendesak" berteks, desa, jam, kebutuhan,
  kode laporan, status. Bagian "Mendesak" berjudul oranye. Header petugas tidak lagi patah tiga
  baris; menu bisa digeser ke samping di layar sempit.
- **Detail laporan**: penanda "Mendesak", "Belum diverifikasi", dan status di bawah judul;
  label "Dirapikan otomatis. Periksa sebelum ditindaklanjuti." atau "Belum dirapikan AI".
- **Meja periksa**: tabel hanya berisi angka yang disebut; sisanya satu kalimat "Tidak disebut di
  pesan mana pun: ...". Angka berbeda ditandai garis dan penanda berteks.
- **Tambah dari WhatsApp**: tombol "Pilih berkas" berbahasa Indonesia menggantikan input bawaan
  browser; tombol nonaktif berbunyi "Tempel pesan dulu".

## Cek terhadap daftar larangan

| Larangan                                                                       | Status                                                                                                  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Krem + serif + terakota; hampir hitam + neon; gaya koran                       | Papan abu-hijau dingin, tanpa serif, oranye hanya untuk perlu tindakan. Garis hanya di tabel petugas.   |
| Kartu seragam, satu radius, bayangan seragam, gradien hias, glass, blob        | Tiga radius per peran, tanpa bayangan. `linear-gradient` hanya untuk animasi sapuan stabilo satu warna. |
| Label kapital kecil, titik tengah, "KATA — penggalan", panah, mono untuk label | Tidak ada. Mono hanya untuk kode laporan.                                                               |
| Satu kata judul diberi gaya beda                                               | Tidak ada.                                                                                              |
| 01/02/03                                                                       | Tidak ada. Kode laporan sungguhan dipakai sebagai nomor karcis.                                         |
| Sparkle, "Powered by AI", emoji, kartun, merah alarm                           | Tidak ada. Status AI berupa teks.                                                                       |
| Animasi setiap section, hover membesar                                         | Tidak ada.                                                                                              |
| Font terlarang, shadcn bawaan                                                  | Atkinson saja, tanpa shadcn.                                                                            |

## Hiasan yang dibuang

Garis hijau di stempel "Diperbarui petugas" pada papan info. Hijau bermakna "langkah sudah
terjadi" di linimasa; di stempel ia hanya hiasan.

## Aksesibilitas

- `tests/e2e/a11y.spec.ts` menjalankan axe (WCAG 2 A/AA dan 2.1 AA) di beranda, lapor (kosong dan
  error), cek status, daftar papan, cara kerja, privasi, tanda terima, dan papan info dengan
  jawaban "belum ada". Hasil terakhir: 0 pelanggaran, termasuk kontras.
- Target sentuh minimal 48 px di sisi korban (40 px untuk tombol ringkas di pita demo dan sisi
  petugas), fokus keyboard berupa cincin tinta 3 px (stabilo di atas blok tinta), dan tata letak
  diuji di 375 px; pada 360 px kartu kebutuhan tetap dua kolom dan kode karcis mengecil lewat
  `clamp()`.
