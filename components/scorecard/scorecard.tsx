import type { Scorecard as ScorecardModel } from "@/lib/decisions/scorecard";
import { SectionHeading } from "./badges";
import { DimensionRow } from "./dimension-row";
import { FitCard } from "./fit-card";
import { PredicateRow, type PredicateTone } from "./predicate-row";

export function Scorecard({ scorecard, threshold }: { scorecard: ScorecardModel; threshold: number }) {
  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
        Suggestion only. A human decides. Answers below {threshold.toFixed(2)} confidence are marked low confidence.
      </p>
      <FitCard fit={scorecard.fit} />

      <Section title="Dimensions" questionType="score">
        <ul className="divide-y">
          {scorecard.dimensions.map((d) => (
            <DimensionRow key={d.key} name={d.name} answer={d.answer} />
          ))}
        </ul>
      </Section>

      <Section title="Must-haves" questionType="predicate" hint="A tick means the model thinks it holds (p ≥ 0.5).">
        <PredicateList items={scorecard.mustHaves} tone="must" />
      </Section>

      <Section title="Red flags" questionType="predicate" hint="A tick means the flag was raised (p ≥ 0.5).">
        <PredicateList items={scorecard.redFlags} tone="flag" />
      </Section>
    </div>
  );
}

function PredicateList({ items, tone }: { items: ScorecardModel["mustHaves"]; tone: PredicateTone }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">None in this rubric.</p>;
  return (
    <ul className="divide-y">
      {items.map((item) => (
        <PredicateRow key={item.key} statement={item.statement} answer={item.answer} tone={tone} />
      ))}
    </ul>
  );
}

function Section({
  title,
  questionType,
  hint,
  children,
}: {
  title: string;
  questionType: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <SectionHeading title={title} questionType={questionType} />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
