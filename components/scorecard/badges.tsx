/** Small rounded label. `tone` picks the semantic colour. */
export function Pill({ tone = "neutral", children }: { tone?: "neutral" | "caution"; children: React.ReactNode }) {
  const colours = tone === "caution" ? "bg-caution-soft text-caution" : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colours}`}>{children}</span>
  );
}

/** Shown on any answer whose confidence is below the configured threshold. */
export function LowConfidenceBadge() {
  return <Pill tone="caution">Low confidence</Pill>;
}

/** A question with no usable answer: the model refused it, or it was absent from the response. */
export function UnansweredChip({ kind }: { kind: "refusal" | "missing" }) {
  return <Pill>{kind === "refusal" ? "Declined by the model" : "No answer returned"}</Pill>;
}

/** Card heading naming the part of the scorecard and the Decisions question type behind it. */
export function SectionHeading({ id, title, questionType }: { id?: string; title: string; questionType: string }) {
  return (
    <h2 id={id} className="text-sm font-medium text-muted-foreground">
      {title} <span className="font-mono text-xs">· {questionType} question</span>
    </h2>
  );
}
