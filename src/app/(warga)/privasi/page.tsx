import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privasi" };

export default function PrivasiPage() {
  return (
    <article className="flex flex-col gap-6">
      <h1 className="text-xl">Privasi</h1>

      <section aria-labelledby="disimpan" className="flex flex-col gap-2">
        <h2 id="disimpan" className="text-lg">
          Yang disimpan
        </h2>
        <p>
          Desa, kebutuhan, orang yang perlu didahulukan, cerita, untuk siapa laporan dibuat, dan
          nomor HP jika Anda mengisinya. Laporan disimpan setelah Anda mencentang persetujuan.
        </p>
      </section>

      <section aria-labelledby="melihat" className="flex flex-col gap-2">
        <h2 id="melihat" className="text-lg">
          Siapa yang bisa melihat
        </h2>
        <ul className="list-disc pl-5">
          <li>Isi cerita dan nomor HP hanya terlihat oleh petugas yang masuk.</li>
          <li>
            Halaman publik (papan info dan halaman status) tidak memuat nama atau nomor HP siapa
            pun. Halaman status hanya menampilkan desa, kebutuhan, dan perkembangan laporan.
          </li>
          <li>
            Nomor HP pelapor tidak pernah dikirim ke layanan AI. Nomor HP yang tertulis di cerita
            atau pesan WhatsApp disamarkan menjadi &ldquo;[nomor disamarkan]&rdquo; sebelum
            diproses.
          </li>
          <li>
            Layanan AI cadangan (Google Gemini versi gratis) dapat memakai teks yang dikirim untuk
            mengembangkan produknya. Karena itu hanya teks yang sudah disamarkan yang dikirim.
          </li>
        </ul>
      </section>

      <section aria-labelledby="dihapus" className="flex flex-col gap-2">
        <h2 id="dihapus" className="text-lg">
          Kapan dihapus
        </h2>
        <ul className="list-disc pl-5">
          <li>Laporan dihapus otomatis setelah 30 hari.</li>
          <li>Data mode demo dihapus setelah 24 jam.</li>
          <li>
            Alamat IP tidak disimpan. Untuk membatasi jumlah laporan per jam, alamat IP diubah
            menjadi kode acak satu arah (hash dengan garam rahasia).
          </li>
        </ul>
      </section>

      <section aria-labelledby="perangkat" className="flex flex-col gap-2">
        <h2 id="perangkat" className="text-lg">
          Di perangkat Anda
        </h2>
        <p>
          Draf formulir, desa terakhir yang dipilih, dan kode laporan Anda disimpan di browser HP
          ini supaya tidak hilang saat sinyal putus. Cookie hanya dipakai untuk sesi mode demo dan
          sesi masuk petugas.
        </p>
      </section>
    </article>
  );
}
