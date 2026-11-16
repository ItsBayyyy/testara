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
    <div className="flex flex-col gap-10">
      {!demoSessionId && (
        // Pita selebar layar walau berada di dalam kolom isi.
        <div className="-mt-6 ml-[calc(50%-50vw)] w-screen">
          <DemoRibbon inSession={false} side="korban" />
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl">Lapor kejadian bencana</h1>
          <p className="mt-2 text-ink-2">{regency.name}. Tanpa aplikasi, tanpa akun.</p>
        </div>
        <Link href="/lapor" className="btn btn-primary min-h-14 w-full text-lg">
          Saya perlu bantuan / mau melapor
        </Link>
        <EmergencyNotice number={config.emergencyNumber} />
      </div>

      <nav aria-label="Lainnya" className="grid grid-cols-2 gap-3">
        <Link href="/info" className="btn btn-secondary">
          Papan info
        </Link>
        <Link href="/status" className="btn btn-secondary">
          Cek status
        </Link>
      </nav>
    </div>
  );
}
