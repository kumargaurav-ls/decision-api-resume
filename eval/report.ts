import { FIT_VALUES } from "../lib/schemas/rubric";
import type { FixtureResult } from "./evaluate";

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const num = (x: number) => x.toFixed(3);

/** Markdown report covering every fixture plus an overall summary. */
export function renderReport(results: FixtureResult[], meta: { mode: "synthetic" | "private"; model: string; mock?: boolean }): string {
  const lines: string[] = [
    `# Decisions API eval report`,
    ``,
    `- Generated: ${new Date().toISOString()}`,
    `- Fixtures: ${meta.mode}${meta.mock ? " (MOCK MODE: canned answers, metrics are not meaningful)" : ""}`,
    `- Decision model: ${meta.model}`,
    ``,
    `## Summary`,
    ``,
    `| Fixture | Resumes | Fit accuracy | Must-have accuracy | Brier (fit) | ECE |`,
    `|---|---|---|---|---|---|`,
    ...results.map(
      (r) =>
        `| ${r.fixture} | ${r.cases.length} | ${pct(r.metrics.fitAccuracy)} | ${pct(r.metrics.mustHaveAccuracy)} | ${num(r.metrics.brierFit)} | ${num(r.metrics.ece)} |`,
    ),
    ``,
    `Brier: 0 is perfect (fit: worst 2; must-haves: coin flip 0.25). ECE: gap between confidence and accuracy, 0 is perfectly calibrated.`,
  ];

  for (const r of results) {
    const m = r.metrics;
    lines.push(
      ``,
      `## ${r.fixture} (rubric v${r.rubricVersion})`,
      ``,
      `### Fit accuracy`,
      ``,
      `${pct(m.fitAccuracy)} of ${r.cases.length} resumes${m.unanswered ? ` (${m.unanswered} unanswered, counted wrong)` : ""}.`,
      ``,
      `### Confusion matrix`,
      ``,
      `Rows: expected. Columns: predicted.`,
      ``,
      `| expected \\ predicted | ${FIT_VALUES.join(" | ")} |`,
      `|---|${FIT_VALUES.map(() => "---").join("|")}|`,
      ...FIT_VALUES.map((value, i) => `| ${value} | ${m.confusion[i].join(" | ")} |`),
      ``,
      `### Must-have accuracy`,
      ``,
      `${pct(m.mustHaveAccuracy)} of must-have answers on the right side of 0.5${m.unansweredMustHaves ? ` (${m.unansweredMustHaves} unanswered, counted wrong)` : ""}.`,
      ``,
      `### Brier scores`,
      ``,
      `- Fit (multi-class): ${num(m.brierFit)}`,
      `- Must-haves (binary): ${num(m.brierMustHaves)}`,
      ``,
      `### Reliability (confidence vs accuracy)`,
      ``,
      `| Confidence | Resumes | Avg confidence | Accuracy |`,
      `|---|---|---|---|`,
      ...m.reliability.map((b) => `| ${b.from.toFixed(1)}-${b.to.toFixed(1)} | ${b.count} | ${b.count ? num(b.avgConfidence) : "-"} | ${b.count ? pct(b.accuracy) : "-"} |`),
      ``,
      `ECE: ${num(m.ece)}`,
      ``,
      `### Most confident misses`,
      ``,
      ...(m.misses.length ? m.misses.map((x) => `- ${x.file} (${x.kind}, confidence ${num(x.confidence)}): ${x.detail}`) : ["None."]),
      ``,
      `### Per resume`,
      ``,
      `| Resume | Profile | Expected | Predicted | Confidence |`,
      `|---|---|---|---|---|`,
      ...r.cases.map((c) => `| ${c.file} | ${c.profile ?? ""} | ${c.expected} | ${c.predicted ?? (c.error ? "error" : "unanswered")} | ${num(c.confidence)} |`),
    );
  }
  return lines.join("\n") + "\n";
}
