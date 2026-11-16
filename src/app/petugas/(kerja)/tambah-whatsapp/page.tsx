import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth/staff";
import { WhatsAppImport } from "./WhatsAppImport";

export const metadata: Metadata = { title: "Tambah dari WhatsApp", robots: { index: false } };

export default async function TambahWhatsAppPage() {
  const staff = await requireStaff();
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-xl">Tambah laporan dari WhatsApp</h1>
      <p className="mt-1 text-ink-2">Nomor HP disamarkan sebelum dikirim.</p>
      <WhatsAppImport sampleUrl={staff.demo ? "/contoh/whatsapp-grup.txt" : null} />
    </div>
  );
}
