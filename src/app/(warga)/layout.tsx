import Link from "next/link";
import { DemoRibbon } from "@/components/warga/DemoRibbon";
import { getRequestScope } from "@/lib/server/scope";

export default async function WargaLayout({ children }: LayoutProps<"/">) {
  const { demoSessionId } = await getRequestScope();
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#isi" className="sr-only-focusable btn btn-secondary absolute left-2 top-2 z-10">
        Lewati ke isi
      </a>
      {demoSessionId && <DemoRibbon inSession side="korban" />}
      <header className="bg-surface">
        <nav
          aria-label="Utama"
          className="mx-auto flex max-w-[35rem] items-center justify-between gap-4 px-4 py-3"
        >
          <Link
            href="/"
            className="flex min-h-12 items-center gap-2 text-lg font-bold no-underline"
          >
            <span aria-hidden className="block h-5 w-2 bg-spidol" />
            Testara
          </Link>
          <Link href="/info" className="flex min-h-12 items-center underline">
            Papan info
          </Link>
        </nav>
      </header>
      <main id="isi" className="mx-auto w-full max-w-[35rem] flex-1 px-4 pb-16 pt-6">
        {children}
      </main>
      <footer>
        <div className="mx-auto flex max-w-[35rem] flex-wrap gap-x-6 gap-y-2 px-4 pb-8 text-sm text-ink-2">
          <Link href="/status" className="min-h-8">
            Cek status laporan
          </Link>
          <Link href="/cara-kerja">Cara kerja</Link>
          <Link href="/privasi">Privasi</Link>
          <Link href="/petugas/masuk">Masuk petugas</Link>
        </div>
      </footer>
    </div>
  );
}
