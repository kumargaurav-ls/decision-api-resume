import type { ScoreAnswer, Unanswered } from "@/lib/decisions/scorecard";
import { percent } from "@/lib/format";
import { LEVEL_LABELS } from "@/lib/schemas/rubric";
import { LowConfidenceBadge, UnansweredChip } from "./badges";

const MAX_LEVEL = LEVEL_LABELS.length - 1;

/**
 * One score question: each level's probability as a column (absolute height), plus the
 * probability-weighted score marked under the columns (it can land between levels).
 */
export function DimensionRow({ name, answer }: { name: string; answer: ScoreAnswer | Unanswered }) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">{name}</h3>
        {answer.kind === "score" ? (
          <p className="flex items-center gap-2 text-sm">
            {answer.lowConfidence && <LowConfidenceBadge />}
            <span className="font-mono tabular-nums">
              {answer.score.toFixed(1)}
              <span className="text-muted-foreground"> / {MAX_LEVEL}</span>
              <span className="sr-only"> weighted score</span>
            </span>
          </p>
        ) : (
          <UnansweredChip kind={answer.kind} />
        )}
      </div>

      {answer.kind === "score" && (
        <div className="mt-3">
          <ol className="grid grid-cols-5 items-end gap-1.5">
            {answer.levels.map((level) => (
              <li key={level.label} className="flex flex-col items-stretch gap-1.5">
                <span className="flex h-14 items-end overflow-hidden rounded-md bg-muted" aria-hidden>
                  <span className="block w-full rounded-md bg-signal" style={{ height: percent(level.probability) }} />
                </span>
                <span className="flex flex-col text-[11px] tracking-[0.01em] text-muted-foreground sm:flex-row sm:items-baseline sm:justify-between sm:gap-1">
                  <span className="truncate">{level.label}</span>
                  <span className="font-mono tabular-nums">{percent(level.probability)}</span>
                </span>
              </li>
            ))}
          </ol>
          {/* The track runs from the centre of the first column to the centre of the last, so
              a score of 2.0 sits under "Working". */}
          <div className="mx-[10%] mt-2" aria-hidden>
            <div className="relative h-1 rounded-full bg-muted">
              <span
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground"
                style={{ left: `${(answer.score / MAX_LEVEL) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
