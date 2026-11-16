import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[35rem] flex-col justify-center gap-4 px-4">
      <h1 className="text-xl">Halaman tidak ditemukan</h1>
      <p>Alamatnya mungkin salah ketik, atau halamannya sudah dipindah.</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/lapor" className="btn btn-primary">
          Lapor kejadian
        </Link>
        <Link href="/" className="btn btn-quiet">
          Ke beranda
        </Link>
      </div>
    </main>
  );
}
