import type { Metadata } from "next";
import { EmergencyNotice } from "@/components/warga/EmergencyNotice";
import { publicConfig } from "@/lib/config";
import { whatsappLink } from "@/lib/whatsapp/format";
import { listVillages, villageLabel } from "@/lib/wilayah";
import { ReportForm } from "./ReportForm";

export const metadata: Metadata = { title: "Lapor kejadian" };

// Pesan untuk pengiriman tanpa JavaScript yang dikembalikan server lewat ?galat=.
const NO_JS_ERRORS: Record<string, string> = {
  needs: "Pilih minimal satu kebutuhan, atau tulis ceritanya.",
  story: "Desa belum dipilih. Tulis lokasinya di cerita.",
  consent: "Centang persetujuan agar laporan bisa disimpan.",
  phone: "Nomor HP hanya berisi angka, contoh 0812 3456 7890.",
  villageCode: "Desa tidak dikenal. Pilih dari daftar.",
  batas:
    "Sudah 5 laporan dari jaringan ini dalam satu jam. Coba lagi nanti, atau kirim lewat WhatsApp.",
  server: "Laporan belum tersimpan. Coba lagi, atau kirim lewat WhatsApp.",
};

export default async function LaporPage({ searchParams }: PageProps<"/lapor">) {
  const { galat } = await searchParams;
  const noJsErrors = (typeof galat === "string" ? galat.split(",") : [])
    .map((k) => NO_JS_ERRORS[k])
    .filter((m): m is string => Boolean(m));
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
      {noJsErrors.length > 0 && (
        <div role="alert" className="flag-action notice px-4 py-3">
          <p className="font-semibold">Laporan belum terkirim:</p>
          <ul className="mt-1 list-disc pl-5">
            {noJsErrors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <a
            className="mt-2 inline-block font-semibold"
            href={whatsappLink(config.poskoWhatsApp, "Laporan warga (lewat WhatsApp):")}
          >
            Kirim lewat WhatsApp
          </a>
        </div>
      )}
      <ReportForm
        villages={villages}
        poskoWhatsApp={config.poskoWhatsApp}
        poskoIsExample={config.poskoIsExample}
      />
    </div>
  );
}
