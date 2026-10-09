import { Check, X } from "lucide-react";
import type { PredicateAnswer, Unanswered } from "@/lib/decisions/scorecard";
import { percent } from "@/lib/format";
import { LowConfidenceBadge, UnansweredChip } from "./badges";

/** Must-haves are good news when they hold; red flags are bad news when they hold. */
export type PredicateTone = "must" | "flag";

/** One predicate: the statement, its probability, and a tick (holds) or cross (doesn't) at 0.5. */
export function PredicateRow({
  statement,
  answer,
  tone,
}: {
  statement: string;
  answer: PredicateAnswer | Unanswered;
  tone: PredicateTone;
}) {
  if (answer.kind !== "predicate") {
    return (
      <li className="flex items-start justify-between gap-4 py-3">
        <span className="text-sm">{statement}</span>
        <UnansweredChip kind={answer.kind} />
      </li>
    );
  }
  const Icon = answer.holds ? Check : X;
  // Colour follows meaning: a met must-have is the accent, a raised flag is caution, the rest neutral.
  const colours = !answer.holds
    ? "bg-muted text-muted-foreground"
    : tone === "must"
      ? "bg-signal-soft text-signal"
      : "bg-caution-soft text-caution";
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${colours}`}>
        <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
      </span>
      <span className="flex-1 text-sm">
        <span className="sr-only">{answer.holds ? "Holds: " : "Does not hold: "}</span>
        {statement}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {answer.lowConfidence && <LowConfidenceBadge />}
        <span className="font-mono text-sm tabular-nums">{percent(answer.probability)}</span>
      </span>
    </li>
  );
}
