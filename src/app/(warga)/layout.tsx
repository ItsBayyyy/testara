import Link from "next/link";

export default function WargaLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="face-warga flex min-h-dvh flex-col">
      <a href="#isi" className="sr-only-focusable btn btn-secondary absolute left-2 top-2 z-10">
        Lewati ke isi
      </a>
      <header className="border-b border-line bg-surface">
        <nav
          aria-label="Utama"
          className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3"
        >
          <Link href="/" className="text-xl font-bold no-underline">
            Testara
          </Link>
          <Link href="/info" className="font-bold underline">
            Papan info
          </Link>
        </nav>
      </header>
      <main id="isi" className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-6">
        {children}
      </main>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-2xl flex-wrap gap-x-5 gap-y-2 px-4 py-5 text-base text-ink-2">
          <Link href="/status">Cek status laporan</Link>
          <Link href="/cara-kerja">Cara kerja</Link>
          <Link href="/privasi">Privasi</Link>
          <Link href="/petugas/masuk">Masuk petugas</Link>
        </div>
      </footer>
    </div>
  );
}
