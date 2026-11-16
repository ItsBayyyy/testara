import Link from "next/link";
import { DemoRibbon } from "@/components/warga/DemoRibbon";
import { EmergencyNotice } from "@/components/warga/EmergencyNotice";
import { publicConfig } from "@/lib/config";
import { getRequestScope } from "@/lib/server/scope";
import { getRegency } from "@/lib/wilayah";

export default async function HomePage() {
  const config = publicConfig();
  const regency = getRegency();
  const { demoSessionId } = await getRequestScope();
  return (
    <div className="flex flex-col gap-8">
      {/* Di beranda, pita demo selalu tampil supaya juri menemukannya tanpa mencari. */}
      {!demoSessionId && (
        // Pita selebar layar walau berada di dalam kolom isi.
        <div className="-mt-6 ml-[calc(50%-50vw)] w-screen">
          <DemoRibbon inSession={false} side="korban" />
        </div>
      )}

      <div className="sheet flex flex-col gap-6">
        <div>
          <h1 className="text-xl">Lapor kejadian bencana di desa Anda</h1>
          <p className="mt-2">
            Untuk warga {regency.name}. Tanpa aplikasi dan tanpa akun. Petugas posko membaca setiap
            laporan.
          </p>
        </div>
        <Link href="/lapor" className="btn btn-primary min-h-14 w-full text-lg">
          Saya perlu bantuan / mau melapor
        </Link>
      </div>

      <EmergencyNotice number={config.emergencyNumber} />

      <nav aria-label="Lainnya" className="flex flex-col gap-4">
        <div>
          <Link href="/info" className="text-lg font-bold underline">
            Papan info desa
          </Link>
          <p className="mt-1 text-ink-2">
            Pengungsian, air bersih, dapur umum, dan kontak posko yang diterbitkan petugas.
          </p>
        </div>
        <div>
          <Link href="/status" className="text-lg font-bold underline">
            Cek status laporan
          </Link>
          <p className="mt-1 text-ink-2">Pakai kode dari karcis laporan Anda.</p>
        </div>
      </nav>
    </div>
  );
}
