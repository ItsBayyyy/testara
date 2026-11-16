import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { logout } from "../actions-auth";
import { PetugasNav } from "./PetugasNav";

export default async function PetugasLayout({ children }: LayoutProps<"/petugas">) {
  const staff = await requireStaff();
  return (
    <div className="face-petugas flex min-h-dvh flex-col">
      <a href="#isi" className="sr-only-focusable btn btn-secondary absolute left-2 top-2 z-10">
        Lewati ke isi
      </a>
      <header className="border-b border-line">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-1 px-4 py-2 lg:px-6">
          <Link href="/petugas" className="py-2 font-semibold no-underline">
            Testara <span className="font-normal text-ink-2">Petugas</span>
          </Link>
          <PetugasNav />
          <div className="ml-auto flex items-center gap-4 text-sm text-ink-2">
            <span>
              {staff.name}
              {staff.demo && " (data contoh)"}
            </span>
            <form action={logout}>
              <button type="submit" className="min-h-10 text-ink underline">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      {staff.demo && (
        <p className="bg-bg px-4 py-2 text-sm text-ink-2 lg:px-6">
          Mode demo untuk juri. Semua data fiktif dan hanya terlihat di sesi ini.{" "}
          <Link href="/" className="text-ink underline">
            Buka sisi korban
          </Link>
        </p>
      )}
      <main id="isi" className="flex-1">
        {children}
      </main>
    </div>
  );
}
