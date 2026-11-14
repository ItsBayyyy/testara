import type { TimelineStep } from "@/lib/domain/status";
import { formatDateTime } from "@/lib/format";

/** Linimasa status laporan. Langkah selesai bertitik hijau, yang belum bertitik kosong. */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative" aria-label="Perkembangan laporan">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[13px] top-8 h-[calc(100%-2rem)] w-0.5 ${
                  steps[i + 1]?.done ? "bg-done" : "bg-line"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border-2 ${
                step.done ? "border-done bg-done" : "border-line-strong bg-surface"
              }`}
            >
              {step.done && <span className="size-2.5 rounded-full bg-white" />}
            </span>
            <div>
              <p className={`font-bold ${step.done ? "" : "text-ink-2"}`}>
                {step.label}
                <span className="sr-only">{step.done ? ", sudah" : ", belum"}</span>
              </p>
              {step.at && <p className="num text-base text-ink-2">{formatDateTime(step.at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
