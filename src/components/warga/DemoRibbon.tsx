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
    <aside aria-label="Mode demo untuk juri" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
        <p className="text-sm">
          <strong>Mode demo untuk juri.</strong> Contoh fiktif untuk demonstrasi
          {inSession ? ", hanya terlihat di perangkat ini." : "."}
        </p>
        <div className="flex flex-wrap gap-2">
          {(!inSession || side === "petugas") && (
            <a href="/demo/korban" className="btn btn-secondary btn-compact">
              Coba sebagai korban
            </a>
          )}
          {(!inSession || side === "korban") && (
            <a href="/demo/petugas" className="btn btn-secondary btn-compact">
              Coba sebagai petugas
            </a>
          )}
          {inSession && (
            <a href="/demo/keluar" className="btn btn-quiet btn-compact">
              Keluar dari demo
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
