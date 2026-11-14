import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/staff";
import { WhatsAppImport } from "./WhatsAppImport";

export const metadata: Metadata = { title: "Tambah dari WhatsApp", robots: { index: false } };

export default async function TambahWhatsAppPage() {
  await requireStaff();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl">Tambah laporan dari WhatsApp</h1>
      <p className="mt-1 text-ink-2">
        Tempel pesan dari grup, atau unggah berkas .txt hasil Ekspor chat. Nomor HP disamarkan di
        perangkat ini sebelum dikirim. Pesan yang berisi laporan masuk antrean dengan sumber
        WhatsApp.
      </p>
      <WhatsAppImport />
    </div>
  );
}
