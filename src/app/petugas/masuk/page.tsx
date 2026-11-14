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
    <main className="face-petugas mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div>
        <Link href="/" className="text-lg font-bold no-underline">
          Testara
        </Link>
        <h1 className="mt-4 text-2xl">Masuk petugas</h1>
        <p className="mt-1 text-ink-2">
          Untuk petugas BPBD dan koordinator posko. Akun dibuat oleh admin.
        </p>
      </div>
      {configured ? (
        <LoginForm />
      ) : (
        <p className="panel px-4 py-3">
          Masuk petugas belum dikonfigurasi di server ini. Juri dan pengunjung bisa mencoba lewat
          mode demo di bawah.
        </p>
      )}
      <div className="border-t border-line pt-5">
        <p className="mb-2 text-ink-2">Ingin mencoba tanpa akun?</p>
        <a href="/demo/petugas" className="btn btn-secondary w-full">
          Masuk sebagai petugas demo
        </a>
        <p className="hint mt-2">
          Data contoh fiktif, hanya terlihat di perangkat ini, dihapus setelah 24 jam.
        </p>
      </div>
    </main>
  );
}
