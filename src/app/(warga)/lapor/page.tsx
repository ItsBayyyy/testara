import type { Metadata } from "next";
import { EmergencyNotice } from "@/components/warga/EmergencyNotice";
import { publicConfig } from "@/lib/config";
import { listVillages, villageLabel } from "@/lib/wilayah";
import { ReportForm } from "./ReportForm";

export const metadata: Metadata = { title: "Lapor kejadian" };

export default function LaporPage() {
  const config = publicConfig();
  const villages = listVillages().map((v) => ({
    code: v.code,
    label: villageLabel(v),
    district: v.districtName,
  }));
  return (
    <div className="flex flex-col gap-6">
      <EmergencyNotice number={config.emergencyNumber} />
      <div>
        <h1 className="text-[1.75rem]">Lapor kejadian</h1>
        <p className="mt-1 text-ink-2">Isi yang Anda tahu saja. Petugas membaca setiap laporan.</p>
      </div>
      <ReportForm
        villages={villages}
        poskoWhatsApp={config.poskoWhatsApp}
        poskoIsExample={config.poskoIsExample}
      />
    </div>
  );
}
