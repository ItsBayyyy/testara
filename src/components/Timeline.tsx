import type { TimelineStep } from "@/lib/domain/status";
import { formatDateTime } from "@/lib/format";

/**
 * Linimasa status laporan. Langkah yang sudah terjadi: lingkaran hijau bercentang dan jam.
 * Langkah berikutnya: lingkaran bergaris dengan tulisan "menunggu", bukan abu pucat.
 */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  const nextIndex = steps.findIndex((s) => !s.done);
  return (
    <ol aria-label="Perkembangan laporan">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[14px] top-9 h-[calc(100%-2.25rem)] w-1 ${
                  steps[i + 1]?.done ? "bg-done" : "bg-line"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`grid size-8 shrink-0 place-items-center rounded-full border-2 ${
                step.done ? "border-done bg-done text-white" : "border-line-strong bg-surface"
              }`}
            >
              {step.done && (
                <svg viewBox="0 0 16 16" className="size-4">
                  <path
                    d="M3 8.5l3.2 3L13 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <div className="pt-1">
              <p className="font-bold">
                {step.label}
                <span className="sr-only">{step.done ? ", sudah" : ", belum"}</span>
              </p>
              {step.at ? (
                <p className="num text-sm text-ink-2">{formatDateTime(step.at)}</p>
              ) : (
                i === nextIndex && <p className="text-sm text-ink-2">Menunggu petugas</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
