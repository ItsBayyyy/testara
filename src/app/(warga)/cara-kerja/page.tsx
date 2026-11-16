import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Cara kerja" };

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li>
      <h3 className="font-bold">{title}</h3>
      <div className="text-ink-2">{children}</div>
    </li>
  );
}

export default function CaraKerjaPage() {
  return (
    <article className="sheet flex flex-col gap-8">
      <header>
        <h1 className="text-xl">Cara kerja Testara</h1>
        <p className="mt-2">
          Testara berasal dari kata Latin <i>testis</i>, saksi. Setiap laporan dan setiap angka
          punya saksi berupa kalimat sumbernya.
        </p>
      </header>

      <section aria-labelledby="masalah" className="flex flex-col gap-3">
        <h2 id="masalah" className="text-lg">
          Masalah yang dijawab
        </h2>
        <p>
          Bencana di Indonesia sangat sering terjadi. Sepanjang 2025, BNPB mencatat 3.233 kejadian
          bencana (
          <a href="https://indonesiabaik.id/infografis/indonesia-tangguh-menghadapi-bencana-2025">
            Indonesia Baik
          </a>
          ). Saat bencana, korban dan keluarganya tidak tahu harus melapor ke mana dan apakah
          laporannya dibaca. Petugas menerima laporan berulang dengan angka berbeda dari banyak
          arah, termasuk grup WhatsApp, dan angka sering dikoreksi belakangan. Contohnya, pada 3
          Desember 2025 BNPB mengoreksi data korban banjir Sumatra menjadi 770 meninggal dan 462
          hilang (
          <a href="https://www.cnnindonesia.com/nasional/20251203190705-20-1302487/bnpb-koreksi-data-korban-banjir-sumatra-770-meninggal-462-hilang">
            CNN Indonesia
          </a>
          ).
        </p>
      </section>

      <section aria-labelledby="korban" className="flex flex-col gap-3">
        <h2 id="korban" className="text-lg">
          Untuk korban dan pelapor
        </h2>
        <ol className="flex flex-col gap-4">
          <Step title="Lapor tanpa aplikasi dan tanpa akun">
            Cukup buka tautan, pilih desa, tekan tombol kebutuhan, dan bercerita. Isian tersimpan di
            HP sampai terkirim.
          </Step>
          <Step title="Laporan disimpan dulu">
            Laporan langsung tersimpan dan Anda mendapat kode. Perapian otomatis berjalan
            sesudahnya, jadi laporan tidak gagal walau layanan AI sedang bermasalah.
          </Step>
          <Step title="Sinyal jelek tetap bisa melapor">
            Jika pengiriman gagal setelah dicoba ulang, Testara menyusun pesan WhatsApp ke posko
            dari isian Anda.
          </Step>
          <Step title="Pantau status">
            Halaman status menunjukkan laporan sudah diterima, dibaca petugas, lalu masuk laporan
            resmi atau perlu konfirmasi. Status bukan janji waktu kedatangan bantuan.
          </Step>
          <Step title="Informasi posko terverifikasi">
            Papan info desa hanya berisi yang diterbitkan petugas. Pertanyaan dijawab hanya dari
            papan itu; jika belum ada, jawabannya &ldquo;Belum ada informasi resmi&rdquo; beserta
            kontak posko.
          </Step>
        </ol>
      </section>

      <section aria-labelledby="petugas" className="flex flex-col gap-3">
        <h2 id="petugas" className="text-lg">
          Untuk petugas
        </h2>
        <ol className="flex flex-col gap-4">
          <Step title="Antrean berdasarkan urgensi">
            Laporan diurutkan dari yang paling mendesak, lalu yang terbaru. Pesan dari grup WhatsApp
            bisa ditempel dan masuk antrean yang sama.
          </Step>
          <Step title="Meja periksa">
            Laporan dikelompokkan per desa dan jenis bencana. Angka yang berbeda antar pelapor
            ditandai dan dipilih petugas, tidak dipilih otomatis. Klik angka untuk melihat kalimat
            sumbernya.
          </Step>
          <Step title="Terbitkan papan info">
            Petugas mengisi dan menerbitkan papan info desa. Setiap terbit disimpan sebagai versi.
          </Step>
        </ol>
      </section>

      <section aria-labelledby="ai" className="flex flex-col gap-3">
        <h2 id="ai" className="text-lg">
          Peran AI dan batasannya
        </h2>
        <ul className="list-disc pl-5">
          <li>
            AI hanya membantu: merapikan laporan, mengusulkan urgensi, dan menjawab dari papan info
            resmi. Petugas yang memutuskan dan menerbitkan.
          </li>
          <li>
            Setiap angka dari AI wajib punya kutipan persis dari pesan asal. Angka yang kutipannya
            tidak ditemukan dibuang. Data yang tidak disebut ditulis &ldquo;tidak disebut&rdquo;,
            bukan 0.
          </li>
          <li>
            Urgensi minimal &ldquo;mendesak&rdquo; ditentukan aturan tetap, bukan AI: kebutuhan
            evakuasi, orang rentan yang butuh evakuasi atau obat, atau kata seperti terjebak, tidak
            bisa keluar, hanyut, tertimbun, sesak napas, pingsan, luka parah, dan pendarahan. AI
            boleh menaikkan urgensi, tidak boleh menurunkannya.
          </li>
          <li>Nomor HP pelapor tidak pernah dikirim ke AI. Nomor di dalam cerita disamarkan.</li>
          <li>
            Hasil AI bisa salah. Karena itu label &ldquo;Dirapikan otomatis. Periksa sebelum
            ditindaklanjuti.&rdquo; selalu tampil di layar petugas.
          </li>
          <li>
            Akurasi diukur dengan kasus uji berlabel di folder <code>eval/</code> repositori. Angka
            hasilnya hanya dicatat di <code>eval/RESULTS.md</code>.
          </li>
        </ul>
      </section>

      <p>
        Baca juga <Link href="/privasi">Privasi</Link>. Testara tidak menggantikan layanan darurat.
      </p>
    </article>
  );
}
