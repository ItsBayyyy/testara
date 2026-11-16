# Audit desain dan dua arah baru

Tanggal: 16 November 2026. Screenshot "before" (28 layar x 375 px dan 1440 px) ada di
`docs/design-audit/before/`, dibuat dengan:

```bash
AUDIT_STAGE=before npx playwright test -c playwright.screenshots.config.ts tests/screenshots/audit.spec.ts
```

Bagian "yang paling saya tidak suka" di brief belum diisi, jadi audit ini memakai keluhan umum
yang tertulis: "jelek dan terasa seperti template AI".

## Langkah 1: masalah yang ditemukan

### Masalah lintas halaman

1. **Tidak punya identitas.** Putih, abu-abu, satu tombol biru tua, garis tipis. Tidak ada satu pun
   yang mengingatkan pada bencana, posko, atau BPBD. Inilah sumber kesan "template".
2. **Semua blok terlihat setara.** Pemberitahuan darurat, ringkasan error, papan tanya, kotak kode
   laporan, dan pita demo memakai latar abu tipis yang sama (`.notice`). Mata tidak tahu mana yang
   penting.
3. **Terlalu pucat.** Teks sekunder abu dipakai untuk banyak hal (petunjuk, deskripsi, meta, footer),
   dan latar `#F3F5F4` hampir tidak terbedakan dari putih di layar HP murah di bawah matahari.
4. **Tipe huruf datar.** Judul `h1` 28 px semibold dan label 18 px semibold beda tipis; ada sekitar
   tujuh ukuran berbeda (14, 15, 16, 17, 18, 20, 28, 30, 40 px). Brief baru meminta paling banyak lima.
5. **Urgensi hanya lewat warna.** Di antrean, laporan mendesak cuma bergaris kiri oranye 3 px. Di
   375 px garis itu hampir tidak terlihat dan tidak punya teks.
6. **Jarak tidak konsisten.** Campuran `gap-2/3/5/6/7/8/10`, `py-2/3/4/5/6`, nilai 0.375rem, 0.625rem.
   Bukan skala 4/8 yang tegas.
7. **Komponen tidak lengkap.** Tidak ada state memuat yang jelas selain teks tombol berganti; tombol
   nonaktif hanya pudar (opacity 0.55, "Proses 0 pesan" terlihat seperti rusak); input berkas memakai
   tampilan bawaan browser berbahasa Inggris ("Choose File No file chosen").

### Per halaman, sisi korban

| Halaman                 | Masalah                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beranda (k01)           | Di 1440 px halaman terasa kosong, kolom 640 px terapung di tengah tanpa jangkar. Tombol utama gelap tapi tidak terasa "darurat". Ajakan telepon 112 memakai tombol putih yang lebih lemah dari tombol lapor, padahal untuk nyawa terancam. Mode demo tampil sebagai paragraf biasa di bawah, mudah terlewat oleh juri.                                                                                                                                                                       |
| Lapor (k10-k14)         | Pemberitahuan darurat dan kotak error memakai gaya yang sama (latar abu + garis oranye). Ringkasan error **tetap tampil setelah isian diperbaiki** (k13: semua sudah diisi, tiga error masih ada), membingungkan. Tanda centang kartu kebutuhan menempel ke teks yang patah baris. Label "Nomor HP untuk dihubungi petugas (tidak wajib)" patah menjadi dua baris dengan "(tidak wajib)" menggantung. Hampir 5.400 px panjang di 375 px. Pita demo memakan dua baris di atas ajakan darurat. |
| Cari desa (k12)         | Hasil pencarian berupa daftar kartu bergaris sama dengan kartu kebutuhan; desa terpilih tampil dalam latar abu yang sama dengan pemberitahuan.                                                                                                                                                                                                                                                                                                                                               |
| Tanda terima (k15)      | Elemen yang seharusnya paling diingat hanya blok abu dengan kode besar. Tidak terasa seperti "tanda terima". Linimasa langkah yang belum terjadi memakai abu pucat sehingga tampak nonaktif, bukan "menunggu".                                                                                                                                                                                                                                                                               |
| Status (k19, k06)       | Kalimat "bukan jaminan waktu kedatangan bantuan" kini teks abu kecil; benar secara makna, tapi terlalu mudah terlewat. Halaman tidak ditemukan hanya teks + satu tombol.                                                                                                                                                                                                                                                                                                                     |
| Cek status (k04, k05)   | Input kode memakai huruf mono besar tapi tanpa contoh format yang jelas di dalam kolom; error tampil oranye tebal dua baris.                                                                                                                                                                                                                                                                                                                                                                 |
| Papan info (k17, k18)   | Kotak tanya berlatar abu menyaingi isi papan. Jawaban "Belum ada informasi resmi" tampil sebagai teks tebal biasa tanpa bentuk yang khas. Nama bagian (Pengungsian, Titik bantuan) sama besar dengan nama tempat. Waktu pembaruan kecil di bawah judul.                                                                                                                                                                                                                                      |
| Daftar papan (k02, k16) | State kosong hanya paragraf dalam blok abu.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Cara kerja (k07)        | Paragraf panjang dengan garis kiri abu untuk setiap langkah; panjang baris di 1440 px mendekati 90 karakter.                                                                                                                                                                                                                                                                                                                                                                                 |

### Per halaman, sisi petugas

| Halaman                              | Masalah                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masuk (p01)                          | Formulir mengambang di tengah layar tanpa identitas; tombol demo dan masuk sungguhan sama beratnya.                                                                                                                                                                                                                                                                                                                                          |
| Antrean (p02-p04)                    | Di 375 px header petugas patah menjadi tiga baris dan memakan sepertiga layar. Baris antrean tinggi (3 baris teks + padding besar) sehingga hanya 6 laporan terlihat di 1440 px; kurang "tabel kerja". Urgensi hanya garis oranye. Filter memakai select tinggi 48 px yang terlalu besar untuk alat kerja. Detail laporan: label "Belum dirapikan AI" dan "Belum diverifikasi" tergabung dalam satu kalimat, kurang menonjol sebagai status. |
| Tambah WhatsApp (p05, p06)           | Input berkas bawaan browser berbahasa Inggris. Textarea monospace kecil. Tombol nonaktif "Proses 0 pesan" abu pudar.                                                                                                                                                                                                                                                                                                                         |
| Kejadian dan meja periksa (p07, p08) | Tabel angka berisi lima baris "tidak disebut" berwarna abu yang mendominasi. Kartu pesan sumber bergaris dengan teks tautan panjang "Ubah status atau urgensi laporan TS-..." di setiap kartu. Penanda angka berbeda (latar oranye muda + garis) cukup jelas tapi belum ada di data demo karena AI belum jalan.                                                                                                                              |
| Papan (p09, p10)                     | Penyunting berupa tumpukan panel bergaris yang identik; tombol "Hapus" dan "Tambah" bergaya tautan sama dengan tautan navigasi.                                                                                                                                                                                                                                                                                                              |

## Langkah 2: dua arah desain

Keduanya mempertahankan Atkinson Hyperlegible (karakter 1/l/I dan 0/O mudah dibedakan, penting untuk
kode laporan dan angka korban) sebagai huruf isi. Yang berbeda adalah sumber visual, warna, dan
bentuk.

### Arah A: "Karcis dan papan tulis posko"

**Konsep:** setiap laporan adalah karcis yang disobek dari blok posko, dan setiap papan info adalah
papan tulis yang ditulisi petugas dengan spidol. Cocok untuk korban panik karena karcis adalah benda
yang mereka kenal dari antrean puskesmas, bank, dan posko: "saya sudah dapat nomor, saya tinggal
menunggu."

**Palet** (kontras dicek terhadap putih dan papan):

| Nama          | Hex       | Satu makna                                   | Kontras                 |
| ------------- | --------- | -------------------------------------------- | ----------------------- |
| Kertas karcis | `#FFFFFF` | permukaan                                    |                         |
| Papan tulis   | `#EDF0EE` | latar halaman dan papan                      |                         |
| Tinta         | `#17212B` | teks                                         | 16,3:1 / 14,2:1         |
| Spidol biru   | `#1E4BA0` | aksi utama dan tautan                        | 8,2:1 / 7,1:1           |
| Spidol oranye | `#B0450F` | mendesak / angka berbeda, selalu dengan teks | 5,7:1 / 4,9:1           |
| Stabilo       | `#FFE14D` | kutipan sumber                               | tinta di atasnya 12,5:1 |

Hijau `#23704A` (6,0:1) hanya untuk langkah linimasa yang sudah terjadi.

**Tipografi:** Atkinson Hyperlegible Next untuk semua teks (judul 700, isi 400). Atkinson
Hyperlegible Mono hanya untuk kode laporan, jam, dan angka di karcis/tabel, karena karcis memang
dicetak dengan angka berjarak sama. Lima ukuran: 15, 17, 20, 26, 40 px.

**Bentuk:** halaman berlatar papan tulis; konten utama di atas "lembar" putih bersudut 4 px. Karcis
punya tepi sobekan bergerigi di satu sisi (satu-satunya hiasan bentuk). Antrean petugas adalah tabel
padat di papan dengan kolom nomor karcis.

```
LAPOR (375 px)                       TANDA TERIMA (375 px)
+----------------------------------+ +----------------------------------+
| Testara                Papan info| | Testara                Papan info|
|==================================| |==================================|
| [!] Ada yang terancam nyawanya?  | | Laporan Anda sudah kami terima.  |
|     [ Telepon 112 ] (biru penuh) | |                                  |
|                                  | |  .----------------------------.  |
| Lapor kejadian                   | |  | KARCIS LAPORAN Desa Pekik  |  |
| ------ lembar putih ------------ | |  |                            |  |
| Desa Anda                        | |  |   TS-KKD6-Z7RQ             |  |
| [ Cari desa...               ]   | |  |   diterima 21.10, 15 Nov   |  |
|                                  | |  |  [ Salin kode ]            |  |
| Apa yang dibutuhkan?             | |  '~/\/\/\/\/\/\/\/\/\/\/\/\/~'  |
| [v Evakuasi  ] [  Air bersih ]   | |   (tepi sobek)                   |
| [  Makanan   ] [  Obat       ]   | |                                  |
| ...                              | |  o-- Diterima           21.10    |
| Ada yang perlu didahulukan?      | |  |                               |
| [x] Lansia   [ ] Disabilitas ... | |  o   Dibaca petugas  (menunggu)  |
| Ceritakan ...                    | |  |                               |
| [                            ]   | |  o   Masuk laporan resmi        |
| [x] Saya setuju disimpan         | |                                  |
| [====== Kirim laporan =======]   | | Status ini bukan jaminan waktu   |
+----------------------------------+ | kedatangan bantuan.              |
                                     | [ Lihat papan info desa ]        |
                                     +----------------------------------+

ANTREAN PETUGAS (1440 px)
+------------------------------------------------------------------------------+
| Testara Petugas | Antrean  Tambah WA  Kejadian  Papan info      Petugas demo |
+------------------------------------------------------------------------------+
| Antrean 12   [Desa v] [Status v]          | Karcis TS-ZHD4-G6AH              |
| No.karcis   Desa        Kebutuhan   Jam   | Desa Srikaton, 03.42, formulir   |
|!MENDESAK                                  | [Belum dirapikan AI] [Belum      |
| TS-ZHD4  Srikaton    evakuasi,bayi  03.42 |  diverifikasi]                   |
| TS-7K4Q  Taba Ter.   evakuasi,lansia 03.35| Urgensi: Mendesak, karena ...    |
| ------------------------------------------| Cerita: ... [stabilo] ...        |
| TS-AB12  Pekik Ny.   makanan        03.13 | [Tandai dibaca] [Resmi] [Konf.]  |
+------------------------------------------------------------------------------+
```

**Elemen yang diingat:** karcis laporan dengan tepi sobek dan kode besar, persis seperti karcis
antrean posko. Karcis yang sama muncul kecil di halaman status dan di detail petugas.

### Arah B: "Terpal dan rompi relawan"

**Konsep:** warna dan bentuk diambil dari terpal biru tenda pengungsian dan rompi oranye relawan
dengan pita reflektif: blok warna tegas yang terbaca dari jauh. Cocok untuk korban panik karena
warnanya langsung dikenali sebagai "ini bantuan resmi", dan blok besar tetap terbaca di layar murah di
bawah matahari.

**Palet:**

| Nama         | Hex       | Satu makna                                         | Kontras                |
| ------------ | --------- | -------------------------------------------------- | ---------------------- |
| Putih        | `#FFFFFF` | permukaan                                          |                        |
| Tinta        | `#101820` | teks                                               | 17,9:1                 |
| Terpal biru  | `#0E4F96` | identitas dan aksi utama (pita atas, tombol utama) | putih di atasnya 8,2:1 |
| Rompi oranye | `#F26B1D` | mendesak saja, sebagai label berisi teks tinta     | tinta di atasnya 5,9:1 |
| Reflektif    | `#B8C0C8` | garis pemisah tebal 4 px (non-teks)                |                        |
| Stabilo      | `#FFE14D` | kutipan sumber                                     |                        |

Hijau `#1F7A47` (5,3:1) untuk langkah selesai; teks oranye bila perlu `#A3420A` (6,3:1).

**Tipografi:** Archivo (variabel, sumbu lebar) untuk judul dan label tombol dengan lebar sedikit
dipadatkan, seperti huruf di papan nama posko dan punggung rompi. Atkinson Hyperlegible Next untuk isi
dan Atkinson Hyperlegible Mono untuk kode. Lima ukuran: 15, 17, 20, 28, 44 px.

**Bentuk:** pita terpal biru penuh lebar di atas setiap halaman korban; tombol utama biru terpal
setinggi 56 px; tombol pilihan kebutuhan berbentuk ubin tegas dengan bingkai 2 px dan centang di
pojok. Label "Mendesak" berupa pita oranye dengan teks tinta, seperti pita rompi. Radius kecil (6 px)
dan berbeda dari kode laporan yang bersudut tegak.

```
LAPOR (375 px)                       TANDA TERIMA (375 px)
+----------------------------------+ +----------------------------------+
|##### TESTARA ##### Papan info ###| |##### TESTARA ##### Papan info ###|
|##################################| |##################################|
| == pita reflektif ============== | | Laporan Anda sudah kami terima.  |
| Ada yang terancam nyawanya?      | |                                  |
| [###### Telepon 112 ##########]  | | ################################ |
|                                  | | #  KODE LAPORAN                # |
| LAPOR KEJADIAN  (Archivo)        | | #  TS-KKD6-Z7RQ  (putih, 44px) # |
| Desa Anda                        | | #  [ Salin kode ]              # |
| [ Cari desa...               ]   | | ################################ |
| Apa yang dibutuhkan?             | |  (blok terpal biru penuh lebar)  |
| +------------+ +------------+    | |                                  |
| |[v]Evakuasi | |   Air      |    | | (o) Diterima             21.10   |
| |   terjebak | |   bersih   |    | |  ||                              |
| +------------+ +------------+    | | ( ) Dibaca petugas               |
| ...                              | |  ||                              |
| [x] Saya setuju disimpan         | | ( ) Masuk laporan resmi          |
| [####### Kirim laporan ######]   | | Status ini bukan jaminan waktu   |
+----------------------------------+ | kedatangan bantuan.              |
                                     +----------------------------------+

ANTREAN PETUGAS (1440 px)
+------------------------------------------------------------------------------+
|### TESTARA PETUGAS ### Antrean | Tambah WA | Kejadian | Papan info | Keluar ###|
+------------------------------------------------------------------------------+
| ANTREAN (12)  [Desa v] [Status v]          | TS-ZHD4-G6AH  [MENDESAK]        |
| [MENDESAK] Srikaton  evakuasi, bayi  03.42 | Srikaton, 03.42, formulir       |
| [MENDESAK] Taba T.   evakuasi, lansia 03.35| Belum dirapikan AI | Belum       |
| ===== pita reflektif ===================== | diverifikasi                    |
|            Pekik N.  makanan         03.13 | ...                             |
+------------------------------------------------------------------------------+
```

**Elemen yang diingat:** tanda terima sebagai blok terpal biru penuh lebar dengan kode putih besar,
terasa seperti papan nama posko yang "menyambut" pelapor.

### Cek terhadap daftar larangan

| Larangan                                                    | Arah A                                                                                                                                                        | Arah B                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Krem hangat + serif + terakota                              | Latar papan tulis abu-hijau dingin, tanpa serif, oranye hanya untuk mendesak. Saya menggeser kertas karcis dari krem ke putih karena krem mendekati larangan. | Putih dan biru terpal, tanpa serif.                                                                                             |
| Hampir hitam + aksen neon                                   | Tidak.                                                                                                                                                        | Tidak; oranye rompi dipakai sebagai label kecil, bukan aksen di latar gelap.                                                    |
| Gaya koran dengan garis tipis di mana-mana                  | Tabel petugas memakai garis, tapi halaman korban dipisah dengan ruang. Saya membuang garis antar-bagian di formulir yang ada di rancangan awal.               | Pemisah tebal reflektif hanya di dua tempat (bawah pita atas, batas mendesak/lainnya).                                          |
| Kartu membulat seragam, satu radius, bayangan tipis seragam | Radius 4 px lembar, karcis bersudut tegak dengan tepi sobek, tombol 6 px. Tanpa bayangan kecuali toast.                                                       | Ubin kebutuhan 6 px, blok terpal tanpa radius, tanpa bayangan.                                                                  |
| Gradien, glass, blob                                        | Tepi sobek dibuat dengan `mask` atau SVG kecil, bukan gradien hiasan.                                                                                         | Tidak ada.                                                                                                                      |
| Label kapital kecil di atas judul                           | Saya mengganti "KARCIS LAPORAN" di wireframe menjadi "Karcis laporan" huruf kalimat.                                                                          | Saya mengganti "KODE LAPORAN" dan "LAPOR KEJADIAN" menjadi huruf kalimat; Archivo yang dipadatkan sudah cukup memberi karakter. |
| Titik tengah, "KATA — penggalan", panah, mono untuk label   | Mono hanya untuk kode, jam, dan angka.                                                                                                                        | Sama.                                                                                                                           |
| Satu kata judul diberi gaya beda                            | Tidak.                                                                                                                                                        | Tidak.                                                                                                                          |
| 01/02/03                                                    | Kolom "No. karcis" berisi kode laporan sungguhan, bukan nomor hias.                                                                                           | Tidak.                                                                                                                          |
| Sparkle AI, emoji, kartun, merah alarm                      | Tidak. Status AI berupa label teks.                                                                                                                           | Tidak. Oranye rompi hanya di label "Mendesak".                                                                                  |
| Animasi setiap section, hover membesar                      | Hanya sapuan stabilo dan pergerakan linimasa.                                                                                                                 | Sama.                                                                                                                           |
| Font terlarang, shadcn bawaan                               | Atkinson saja.                                                                                                                                                | Archivo dan Atkinson; Archivo tidak ada di daftar larangan.                                                                     |

### Rekomendasi: Arah A, "Karcis dan papan tulis posko"

- Elemen yang diingat (tanda terima) langsung lahir dari metafornya: korban memegang "karcis"
  laporan, dan karcis yang sama muncul di status serta di layar petugas. Satu identitas, dua sisi.
- Papan tulis cocok untuk petugas: tabel padat, kolom nomor karcis, stabilo kuning untuk kutipan.
  Arah B lebih kuat di sisi korban, tapi pita biru penuh dan huruf padat membuat alat kerja petugas
  terasa berat.
- Arah A tidak menambah keluarga huruf, jadi halaman korban tetap paling ringan untuk Slow 3G.
- Risiko Arah A: jika dikerjakan setengah hati, hasilnya bisa kembali pucat. Karena itu biru spidol
  dipakai penuh untuk aksi utama dan ajakan telepon 112, dan latar papan cukup gelap untuk terlihat.

Saya berhenti di sini dan menunggu pilihan Anda sebelum mengubah kode tampilan.

### Hal yang akan diperbaiki apa pun arahnya

- Ringkasan error formulir lapor tetap tampil setelah isian diperbaiki (perilaku tampilan, bukan
  logika validasi).
- Input berkas berbahasa Inggris di "Tambah dari WhatsApp".
- Header petugas yang patah menjadi tiga baris di layar sempit.
- Urgensi yang hanya ditandai warna di antrean dan daftar kejadian.
