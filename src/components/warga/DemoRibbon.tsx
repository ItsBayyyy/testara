/**
 * Pita mode demo untuk juri. Di beranda menawarkan dua pintu masuk; di dalam sesi demo
 * mengingatkan bahwa data fiktif dan menawarkan pindah sisi.
 */
export function DemoRibbon({
  inSession,
  side,
}: {
  inSession: boolean;
  side: "korban" | "petugas";
}) {
  return (
    <aside aria-label="Mode demo untuk juri" className="bg-bg">
      <div className="mx-auto flex max-w-[35rem] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <p>
          <strong>Mode demo untuk juri.</strong>{" "}
          <span className="text-ink-2">Contoh fiktif untuk demonstrasi.</span>
        </p>
        <div className="flex flex-wrap gap-x-4">
          {(!inSession || side === "petugas") && (
            <a href="/demo/korban" className="underline">
              Coba sebagai korban
            </a>
          )}
          {(!inSession || side === "korban") && (
            <a href="/demo/petugas" className="underline">
              Coba sebagai petugas
            </a>
          )}
          {inSession && (
            <a href="/demo/keluar" className="text-ink-2 underline">
              Keluar dari demo
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
