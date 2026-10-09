import type { Scorecard } from "@/lib/decisions/scorecard";
import { percent } from "@/lib/format";
import type { FitValue } from "@/lib/schemas/rubric";
import { LowConfidenceBadge, SectionHeading, UnansweredChip } from "./badges";

const FIT_LABELS: Record<FitValue, string> = {
  strong_fit: "Strong fit",
  possible_fit: "Possible fit",
  weak_fit: "Weak fit",
};

const fitLabel = (value: string) => FIT_LABELS[value as FitValue] ?? value;

/** Overall fit: the chosen option, every option's probability, and the model's confidence. */
export function FitCard({ fit }: { fit: Scorecard["fit"] }) {
  return (
    <section aria-labelledby="fit-heading" className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <SectionHeading id="fit-heading" title="Overall fit" questionType="choice" />
        {fit.kind === "choice" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {fit.lowConfidence && <LowConfidenceBadge />}
            <span>
              confidence <span className="font-mono tabular-nums text-foreground">{fit.confidence.toFixed(2)}</span>
            </span>
          </p>
        )}
      </div>

      {fit.kind === "choice" ? (
        <>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{fitLabel(fit.choice)}</p>
          <ul className="mt-5 space-y-2.5">
            {fit.options.map((option) => {
              const chosen = option.value === fit.choice;
              return (
                <li key={option.value} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm">
                  <span className={chosen ? "font-medium" : "text-muted-foreground"}>{fitLabel(option.value)}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span
                      className={`block h-full rounded-full ${chosen ? "bg-signal" : "bg-foreground/25"}`}
                      style={{ width: percent(option.probability) }}
                    />
                  </span>
                  <span className="text-right font-mono tabular-nums">{percent(option.probability)}</span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="mt-3">
          <UnansweredChip kind={fit.kind} />
        </div>
      )}
    </section>
  );
}
