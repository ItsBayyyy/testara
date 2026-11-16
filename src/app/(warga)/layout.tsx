import Link from "next/link";
import { getRequestScope } from "@/lib/server/scope";

export default async function WargaLayout({ children }: LayoutProps<"/">) {
  const { demoSessionId } = await getRequestScope();
  return (
    <div className="face-warga flex min-h-dvh flex-col">
      <a href="#isi" className="sr-only-focusable btn btn-secondary absolute left-2 top-2 z-10">
        Lewati ke isi
      </a>
      <header className="border-b border-line">
        <nav
          aria-label="Utama"
          className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4"
        >
          <Link href="/" className="text-lg font-semibold no-underline">
            Testara
          </Link>
          <Link href="/info" className="text-base underline decoration-line-strong">
            Papan info
          </Link>
        </nav>
      </header>
      {demoSessionId && (
        <p className="bg-bg">
          <span className="mx-auto block max-w-2xl px-4 py-2 text-[0.9375rem] text-ink-2">
            Mode demo, data contoh fiktif.{" "}
            <a href="/demo/petugas" className="text-ink underline">
              Buka sisi petugas
            </a>
            {" atau "}
            <a href="/demo/keluar" className="text-ink underline">
              keluar dari demo
            </a>
          </span>
        </p>
      )}
      <main id="isi" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-8">
        {children}
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-2xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-[0.9375rem] text-ink-2">
          <Link href="/status">Cek status laporan</Link>
          <Link href="/cara-kerja">Cara kerja</Link>
          <Link href="/privasi">Privasi</Link>
          <Link href="/petugas/masuk">Masuk petugas</Link>
        </div>
      </footer>
    </div>
  );
}
