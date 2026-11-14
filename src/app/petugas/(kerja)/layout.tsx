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
      <header className="border-b border-line bg-ink text-white">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
          <Link href="/petugas" className="py-2 font-bold no-underline">
            Testara <span className="font-normal">Petugas</span>
          </Link>
          <PetugasNav />
          <div className="ml-auto flex items-center gap-3 text-[0.9375rem]">
            <span>
              {staff.name}
              {staff.demo && " (data contoh)"}
            </span>
            <form action={logout}>
              <button type="submit" className="min-h-10 underline">
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>
      {staff.demo && (
        <p className="border-b border-line bg-surface px-4 py-2 text-[0.9375rem]">
          Mode demo untuk juri. Semua data fiktif dan hanya terlihat di sesi ini.{" "}
          <Link href="/" className="font-bold">
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
