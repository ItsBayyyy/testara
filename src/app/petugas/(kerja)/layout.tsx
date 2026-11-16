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
      {staff.demo && (
        <aside aria-label="Mode demo untuk juri" className="border-b border-line bg-surface">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1 lg:px-6">
            <span>
              <strong>Mode demo untuk juri.</strong> Contoh fiktif untuk demonstrasi.
            </span>
            <a href="/demo/korban" className="underline">
              Coba sebagai korban
            </a>
          </p>
        </aside>
      )}
      <header className="border-b border-line bg-surface">
        <div className="flex flex-wrap items-center gap-x-6 px-4 lg:px-6">
          <Link href="/petugas" className="flex min-h-12 items-center gap-2 font-bold no-underline">
            <span aria-hidden className="block h-4 w-1.5 bg-spidol" />
            Testara <span className="font-normal text-ink-2">Petugas</span>
          </Link>
          <div className="order-2 flex items-center gap-3 text-ink-2 sm:order-3 sm:ml-auto max-sm:ml-auto">
            <span className="max-sm:hidden">
              {staff.name}
              {staff.demo && " (data contoh)"}
            </span>
            <form action={logout}>
              <button type="submit" className="min-h-10 text-ink underline">
                Keluar
              </button>
            </form>
          </div>
          <div className="order-3 w-full sm:order-2 sm:w-auto">
            <PetugasNav />
          </div>
        </div>
      </header>
      <main id="isi" className="flex-1">
        {children}
      </main>
    </div>
  );
}
