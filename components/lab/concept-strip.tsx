import { LEVEL_LABELS } from "@/lib/schemas/rubric";

/** Example numbers for the walkthrough. Labelled as examples on the page; the lab below is live. */
const EXAMPLE_FIT = [
  { value: "strong_fit", probability: 0.2 },
  { value: "possible_fit", probability: 0.7 },
  { value: "weak_fit", probability: 0.1 },
];
const EXAMPLE_LEVELS = [0.05, 0.1, 0.2, 0.4, 0.25];
const EXAMPLE_SCORE = EXAMPLE_LEVELS.reduce((sum, p, level) => sum + p * level, 0);

/** Three steps, left to right: the question limits the answers, Luna spreads probability, the app reads the answer off. */
export function ConceptStrip() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      <Step n={1} title="Ask a typed question" lede="Each question type fixes the answers Luna is allowed to give. It can't write anything else.">
        <dl className="space-y-3 text-sm">
          <TypeRow type="predicate" answers={["true", "false"]} />
          <TypeRow type="choice" answers={["strong_fit", "possible_fit", "weak_fit"]} />
          <TypeRow type="score" answers={[...LEVEL_LABELS]} />
        </dl>
      </Step>

      <Step n={2} title="Luna spreads probability" lede="It reads the input once and puts a probability on every allowed answer. Output is 0 tokens.">
        <ul className="space-y-2" aria-label="Example probabilities for a choice question">
          {EXAMPLE_FIT.map((option) => (
            <li key={option.value} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-xs">
              <span className="font-mono text-muted-foreground">{option.value}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <span className="block h-full rounded-full bg-signal" style={{ width: `${option.probability * 100}%` }} />
              </span>
              <span className="text-right font-mono tabular-nums">{option.probability.toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Example numbers. The probabilities always add up to 1.</p>
      </Step>

      <Step n={3} title="Read the answer off" lede="The app turns the spread into an answer. Nothing here is a second model call.">
        <ul className="space-y-2.5 text-sm">
          <li>
            <span className="font-medium">choice</span> <span className="text-muted-foreground">the top option wins:</span>{" "}
            <span className="font-mono text-xs">possible_fit</span>
          </li>
          <li>
            <span className="font-medium">predicate</span> <span className="text-muted-foreground">holds when p ≥ 0.5</span>
          </li>
          <li>
            <span className="font-medium">score</span> <span className="text-muted-foreground">is Σ p × level, so it can land between levels:</span>
            <span className="mt-1 block overflow-x-auto font-mono text-xs tabular-nums">
              {EXAMPLE_LEVELS.map((p, level) => `${level}×${p.toFixed(2)}`).join(" + ")} = {EXAMPLE_SCORE.toFixed(2)}
            </span>
          </li>
        </ul>
      </Step>
    </ol>
  );
}

function Step({ n, title, lede, children }: { n: number; title: string; lede: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="space-y-1">
        <p className="font-mono text-xs text-signal">Step {n}</p>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{lede}</p>
      </div>
      <div>{children}</div>
    </li>
  );
}

function TypeRow({ type, answers }: { type: string; answers: string[] }) {
  return (
    <div className="space-y-1.5">
      <dt className="font-medium">{type}</dt>
      <dd className="flex flex-wrap gap-1">
        {answers.map((answer) => (
          <span key={answer} className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {answer}
          </span>
        ))}
      </dd>
    </div>
  );
}
