import Link from "next/link";
import { EmergencyNotice } from "@/components/warga/EmergencyNotice";
import { publicConfig } from "@/lib/config";
import { getRegency } from "@/lib/wilayah";

export default function HomePage() {
  const config = publicConfig();
  const regency = getRegency();
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-[1.75rem]">Lapor kejadian bencana, lihat informasi posko</h1>
        <p className="mt-2 text-ink-2">
          Untuk warga {regency.name}. Tanpa aplikasi, tanpa daftar akun.
        </p>
      </div>

      <Link href="/lapor" className="btn btn-primary min-h-20 w-full text-xl">
        Saya perlu bantuan / mau melapor
      </Link>

      <EmergencyNotice number={config.emergencyNumber} />

      <section
        aria-labelledby="judul-demo"
        className="panel rounded-[var(--radius-field)] px-4 py-4"
      >
        <h2 id="judul-demo" className="text-lg">
          Mode demo untuk juri
        </h2>
        <p className="text-base text-ink-2">
          Coba kedua sisi tanpa mendaftar. Data contoh fiktif, hanya terlihat di perangkat Anda, dan
          dihapus setelah 24 jam.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/demo/korban" className="btn btn-secondary">
            Coba sebagai korban
          </a>
          <a href="/demo/petugas" className="btn btn-secondary">
            Coba sebagai petugas
          </a>
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        <li>
          <Link href="/info" className="font-bold underline">
            Lihat papan info desa
          </Link>
          <p className="text-base text-ink-2">
            Lokasi pengungsian, air bersih, dapur umum, dan kontak posko yang diterbitkan petugas.
          </p>
        </li>
        <li>
          <Link href="/status" className="font-bold underline">
            Cek status laporan
          </Link>
          <p className="text-base text-ink-2">Pakai kode yang Anda terima setelah melapor.</p>
        </li>
      </ul>
    </div>
  );
}
