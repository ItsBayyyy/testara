import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getStaff } from "@/lib/auth/staff";
import { authConfigured } from "@/lib/auth/supabase-server";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Masuk petugas", robots: { index: false } };

export default async function MasukPage() {
  if (await getStaff()) redirect("/petugas");
  const configured = authConfigured();
  return (
    <main className="face-petugas mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold no-underline">
        <span aria-hidden className="block size-3 bg-spidol" />
        Testara
      </Link>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl">Masuk petugas</h1>
          <p className="mt-1 text-ink-2">
            Untuk petugas BPBD dan koordinator posko. Akun dibuat oleh admin.
          </p>
        </div>
        {configured ? (
          <LoginForm />
        ) : (
          <p className="notice px-4 py-3">
            Masuk petugas belum dikonfigurasi di server ini. Juri dan pengunjung bisa mencoba lewat
            mode demo di bawah.
          </p>
        )}
      </div>
      <div>
        <p className="font-bold">Mode demo untuk juri</p>
        <p className="mt-1 text-ink-2">
          Contoh fiktif untuk demonstrasi, hanya terlihat di perangkat ini, dihapus setelah 24 jam.
        </p>
        <a href="/demo/petugas" className="btn btn-secondary mt-3 w-full">
          Masuk sebagai petugas demo
        </a>
      </div>
    </main>
  );
}
