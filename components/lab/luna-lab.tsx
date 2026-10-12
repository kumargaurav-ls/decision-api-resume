"use client";

import { useEffect, useRef, useState } from "react";
import { labDecideAction } from "@/app/how-luna-decides/actions";
import { LowConfidenceBadge, UnansweredChip } from "@/components/scorecard/badges";
import type { ChoiceAnswer, PredicateAnswer, ScoreAnswer, Unanswered } from "@/lib/decisions/scorecard";
import { percent } from "@/lib/format";
import { LAB_HEADER, LAB_LINES, LAB_RUBRIC, type LabLineKind, type LabResult } from "@/lib/lab";

/** Wait this long after the last toggle before calling, so a burst of clicks makes one call. */
const SETTLE_MS = 350;

const KIND_LABELS: Record<LabLineKind, string> = {
  evidence: "Evidence",
  weak: "Weak evidence",
  keywords: "Keywords only",
  injection: "Injection attempt",
};

const FIT_LABELS: Record<string, string> = { strong_fit: "Strong fit", possible_fit: "Possible fit", weak_fit: "Weak fit" };
const BAR_MOTION = "transition-[width,height,left] duration-500 ease-out";

/** Switch resume lines on and off; every settled change is one live Decisions call. */
export function LunaLab() {
  const [on, setOn] = useState<ReadonlySet<string>>(() => new Set(LAB_LINES.filter((line) => line.on).map((line) => line.id)));
  const [result, setResult] = useState<LabResult | null>(null);
  const [previous, setPrevious] = useState<LabResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const latestCall = useRef(0);

  // The answer on screen when a new one arrives becomes `previous`, for the deltas.
  const shown = useRef<LabResult | null>(null);

  useEffect(() => {
    const call = ++latestCall.current;
    const timer = setTimeout(async () => {
      let state: Awaited<ReturnType<typeof labDecideAction>>;
      try {
        state = await labDecideAction([...on]);
      } catch (caught) {
        state = { ok: false, error: caught instanceof Error ? caught.message : String(caught) };
      }
      if (call !== latestCall.current) return; // a newer toggle superseded this call
      setPending(false);
      if (state.ok) {
        setPrevious(shown.current);
        shown.current = state.result;
        setResult(state.result);
        setError(null);
      } else {
        setError(state.error);
      }
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [on]);

  function toggle(id: string) {
    setPending(true);
    setOn((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section aria-labelledby="candidate-heading" className="space-y-4">
        <div>
          <h2 id="candidate-heading" className="text-base font-semibold tracking-tight">
            The resume
          </h2>
          <p className="text-sm text-muted-foreground">Switch lines on and off. Luna only sees the lines that are on.</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <p className="px-2 pb-3 text-sm font-medium">{LAB_HEADER}</p>
          <ul className="space-y-1.5">
            {LAB_LINES.map((line) => {
              const active = on.has(line.id);
              return (
                <li key={line.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(line.id)}
                    className="group flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60 active:scale-[0.99]"
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${active ? "bg-signal" : "bg-muted-foreground/25"}`}
                    >
                      <span className={`size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? "translate-x-4" : ""}`} />
                    </span>
                    <span className="min-w-0 space-y-1">
                      <span className={`block text-sm transition-opacity ${active ? "" : "text-muted-foreground line-through decoration-muted-foreground/40 opacity-60"}`}>
                        {line.text}
                      </span>
                      <KindTag kind={line.kind} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <ThingsToTry />
      </section>

      <section aria-labelledby="answers-heading" aria-busy={pending} className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="answers-heading" className="text-base font-semibold tracking-tight">
              What Luna answers
            </h2>
            <p className="text-sm text-muted-foreground">Three questions, one call. Bars move from the last answer to the new one.</p>
          </div>
          <CallStatus pending={pending} result={result} />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className={`space-y-4 transition-opacity duration-300 ${pending && result ? "opacity-70" : ""}`}>
          <PredicateCard answer={result?.predicate} previous={previous?.predicate} />
          <ScoreCard answer={result?.score} previous={previous?.score} />
          <ChoiceCard answer={result?.choice} previous={previous?.choice} />
        </div>

        {result && (
          <details className="rounded-2xl border bg-card px-5 py-4 text-sm">
            <summary className="cursor-pointer font-medium">What Luna saw</summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-mono text-xs">{result.input}</pre>
            <p className="mt-2 text-xs text-muted-foreground">
              Every question also tells Luna to treat the resume as evidence, not instructions.
            </p>
          </details>
        )}
      </section>
    </div>
  );
}

function CallStatus({ pending, result }: { pending: boolean; result: LabResult | null }) {
  return (
    <p role="status" className="font-mono text-xs tabular-nums text-muted-foreground">
      {pending ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-signal" aria-hidden />
          asking {result?.model ?? "Luna"}…
        </span>
      ) : result ? (
        `${result.model} · ${result.latencyMs.toLocaleString()} ms · $${result.costUsd.toFixed(6)}`
      ) : null}
    </p>
  );
}

function KindTag({ kind }: { kind: LabLineKind }) {
  const tone =
    kind === "injection" ? "bg-destructive/10 text-destructive" : kind === "evidence" ? "bg-signal-soft text-signal" : "bg-caution-soft text-caution";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{KIND_LABELS[kind]}</span>;
}

function ThingsToTry() {
  return (
    <div className="rounded-2xl bg-muted/50 px-5 py-4 text-sm">
      <p className="font-medium">Things to try</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>Switch on the 2026 RAG line. The production predicate should jump.</li>
        <li>Switch off the prototype and keep the keywords. Do keywords alone count?</li>
        <li>Switch on the injection line. Fit should not become strong.</li>
        <li>Switch everything off. Luna still answers, from almost no evidence.</li>
      </ul>
    </div>
  );
}

function Card({ title, type, extra, children }: { title: string; type: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">
          {title} <span className="font-mono text-xs text-muted-foreground">· {type}</span>
        </h3>
        {extra}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** "+0.42" next to a number, when there is a previous answer to compare with. */
function Delta({ now, before, digits = 2 }: { now: number; before: number | undefined; digits?: number }) {
  if (before === undefined) return null;
  const change = now - before;
  if (Math.abs(change) < 10 ** -digits / 2) return <span className="font-mono text-xs text-muted-foreground">±0</span>;
  return (
    <span className={`font-mono text-xs tabular-nums ${change > 0 ? "text-signal" : "text-caution"}`}>
      {change > 0 ? "+" : "−"}
      {Math.abs(change).toFixed(digits)}
    </span>
  );
}

function Waiting() {
  return <div className="h-16 animate-pulse rounded-xl bg-muted" aria-hidden />;
}

function PredicateCard({ answer, previous }: { answer: PredicateAnswer | Unanswered | undefined; previous: PredicateAnswer | Unanswered | undefined }) {
  const statement = LAB_RUBRIC.mustHaves[0].statement;
  return (
    <Card
      title="Shipped an LLM system to production?"
      type="predicate"
      extra={answer?.kind === "predicate" && (
        <span className="flex items-center gap-2 text-sm">
          {answer.lowConfidence && <LowConfidenceBadge />}
          <span className={answer.holds ? "font-medium text-signal" : "text-muted-foreground"}>{answer.holds ? "✓ holds" : "✗ doesn't hold"}</span>
        </span>
      )}
    >
      <p className="mb-4 text-sm text-muted-foreground">&ldquo;{statement}&rdquo;</p>
      {!answer ? (
        <Waiting />
      ) : answer.kind !== "predicate" ? (
        <UnansweredChip kind={answer.kind} />
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold tabular-nums">p = {answer.probability.toFixed(2)}</span>
            <Delta now={answer.probability} before={previous?.kind === "predicate" ? previous.probability : undefined} />
          </div>
          <div className="relative mt-3 h-3 rounded-full bg-muted" aria-hidden>
            <span className={`absolute inset-y-0 left-0 rounded-full ${answer.holds ? "bg-signal" : "bg-foreground/30"} ${BAR_MOTION}`} style={{ width: percent(answer.probability) }} />
            <span className="absolute -inset-y-1 left-1/2 w-px bg-foreground/60" />
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground" aria-hidden>
            <span>0 false</span>
            <span>0.5</span>
            <span>true 1</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function ScoreCard({ answer, previous }: { answer: ScoreAnswer | Unanswered | undefined; previous: ScoreAnswer | Unanswered | undefined }) {
  const maxLevel = LAB_RUBRIC.dimensions[0].levels.length - 1;
  return (
    <Card
      title="Python depth"
      type="score"
      extra={answer?.kind === "score" && (
        <span className="flex items-center gap-2 text-sm">
          {answer.lowConfidence && <LowConfidenceBadge />}
          <span className="font-mono tabular-nums">
            {answer.score.toFixed(2)} <span className="text-muted-foreground">/ {maxLevel}</span>
          </span>
          <Delta now={answer.score} before={previous?.kind === "score" ? previous.score : undefined} />
        </span>
      )}
    >
      {!answer ? (
        <Waiting />
      ) : answer.kind !== "score" ? (
        <UnansweredChip kind={answer.kind} />
      ) : (
        <div>
          <ol className="grid grid-cols-5 items-end gap-1.5">
            {answer.levels.map((level, i) => (
              <li key={level.label} className="flex flex-col gap-1.5">
                <span className="flex h-20 items-end overflow-hidden rounded-md bg-muted" aria-hidden>
                  <span className={`block w-full rounded-md bg-signal ${BAR_MOTION}`} style={{ height: percent(level.probability) }} />
                </span>
                <span className="flex flex-col text-[11px] text-muted-foreground sm:flex-row sm:justify-between sm:gap-1">
                  <span className="truncate">
                    {i} {level.label}
                  </span>
                  <span className="font-mono tabular-nums">{percent(level.probability)}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mx-[10%] mt-2" aria-hidden>
            <div className="relative h-1 rounded-full bg-muted">
              <span
                className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground ${BAR_MOTION}`}
                style={{ left: `${(answer.score / maxLevel) * 100}%` }}
              />
            </div>
          </div>
          <p className="mt-4 overflow-x-auto rounded-lg bg-muted/40 px-3 py-2 font-mono text-xs tabular-nums text-muted-foreground">
            Σ p × level = {answer.levels.map((level, i) => `${i}×${level.probability.toFixed(2)}`).join(" + ")} ≈{" "}
            <span className="text-foreground">{answer.levels.reduce((sum, level, i) => sum + level.probability * i, 0).toFixed(2)}</span>
          </p>
        </div>
      )}
    </Card>
  );
}

function ChoiceCard({ answer, previous }: { answer: ChoiceAnswer | Unanswered | undefined; previous: ChoiceAnswer | Unanswered | undefined }) {
  const before = previous?.kind === "choice" ? previous : undefined;
  return (
    <Card
      title="Overall fit"
      type="choice"
      extra={answer?.kind === "choice" && (
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          {answer.lowConfidence && <LowConfidenceBadge />}
          confidence <span className="font-mono tabular-nums text-foreground">{answer.confidence.toFixed(2)}</span>
        </span>
      )}
    >
      {!answer ? (
        <Waiting />
      ) : answer.kind !== "choice" ? (
        <UnansweredChip kind={answer.kind} />
      ) : (
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {FIT_LABELS[answer.choice] ?? answer.choice}
            {before && before.choice !== answer.choice && (
              <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">was {FIT_LABELS[before.choice] ?? before.choice}</span>
            )}
          </p>
          <ul className="mt-4 space-y-2.5">
            {answer.options.map((option) => {
              const chosen = option.value === answer.choice;
              const was = before?.options.find((o) => o.value === option.value)?.probability;
              return (
                <li key={option.value} className="grid grid-cols-[6.5rem_1fr_2.75rem_2.75rem] items-center gap-2 text-sm">
                  <span className={chosen ? "font-medium" : "text-muted-foreground"}>{FIT_LABELS[option.value] ?? option.value}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span className={`block h-full rounded-full ${chosen ? "bg-signal" : "bg-foreground/25"} ${BAR_MOTION}`} style={{ width: percent(option.probability) }} />
                  </span>
                  <span className="text-right font-mono tabular-nums">{percent(option.probability)}</span>
                  <span className="text-right">
                    <Delta now={option.probability} before={was} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
