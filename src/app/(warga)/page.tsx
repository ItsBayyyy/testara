import Link from "next/link";
import { EmergencyNotice } from "@/components/warga/EmergencyNotice";
import { publicConfig } from "@/lib/config";
import { getRegency } from "@/lib/wilayah";

export default function HomePage() {
  const config = publicConfig();
  const regency = getRegency();
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-[1.875rem]">Lapor kejadian bencana, lihat informasi posko</h1>
          <p className="mt-3 text-ink-2">
            Untuk warga {regency.name}. Tanpa aplikasi, tanpa daftar akun.
          </p>
        </div>
        <Link href="/lapor" className="btn btn-primary min-h-16 w-full text-lg">
          Saya perlu bantuan / mau melapor
        </Link>
        <EmergencyNotice number={config.emergencyNumber} />
      </div>

      <ul className="flex flex-col divide-y divide-line border-y border-line">
        <li className="py-4">
          <Link href="/info" className="font-semibold underline decoration-line-strong">
            Lihat papan info desa
          </Link>
          <p className="mt-1 text-base text-ink-2">
            Lokasi pengungsian, air bersih, dapur umum, dan kontak posko yang diterbitkan petugas.
          </p>
        </li>
        <li className="py-4">
          <Link href="/status" className="font-semibold underline decoration-line-strong">
            Cek status laporan
          </Link>
          <p className="mt-1 text-base text-ink-2">Pakai kode yang Anda terima setelah melapor.</p>
        </li>
      </ul>

      <section aria-labelledby="judul-demo">
        <h2 id="judul-demo" className="text-base">
          Mode demo untuk juri
        </h2>
        <p className="mt-1 text-base text-ink-2">
          Coba kedua sisi tanpa mendaftar. Data contoh fiktif, hanya terlihat di perangkat Anda, dan
          dihapus setelah 24 jam.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/demo/korban" className="btn btn-secondary btn-compact">
            Coba sebagai korban
          </a>
          <a href="/demo/petugas" className="btn btn-secondary btn-compact">
            Coba sebagai petugas
          </a>
        </div>
      </section>
    </div>
  );
}
