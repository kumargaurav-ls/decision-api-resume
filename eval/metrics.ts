import { FIT_VALUES } from "../lib/schemas/rubric";

export type FitCase = {
  expected: string;
  predicted: string;
  confidence: number;
  probabilities: Record<string, number>;
};
export type PredicateCase = { expected: boolean; probability: number };
export type CalibrationPoint = { confidence: number; correct: boolean };
export type ReliabilityBin = { from: number; to: number; count: number; avgConfidence: number; accuracy: number };

export function fitAccuracy(cases: Pick<FitCase, "expected" | "predicted">[]): number {
  return mean(cases.map((c) => (c.expected === c.predicted ? 1 : 0)));
}

/** Rows: expected, columns: predicted, both in strong / possible / weak order. */
export function confusionMatrix(cases: Pick<FitCase, "expected" | "predicted">[]): number[][] {
  const matrix = FIT_VALUES.map(() => FIT_VALUES.map(() => 0));
  for (const c of cases) {
    const row = FIT_VALUES.indexOf(c.expected as (typeof FIT_VALUES)[number]);
    const col = FIT_VALUES.indexOf(c.predicted as (typeof FIT_VALUES)[number]);
    if (row >= 0 && col >= 0) matrix[row][col]++;
  }
  return matrix;
}

/** Mean over cases of Σ_k (p_k − y_k)², where y is one-hot on the expected value. 0 is perfect, 2 is worst. */
export function brierMulticlass(cases: Pick<FitCase, "expected" | "probabilities">[]): number {
  return mean(
    cases.map((c) => FIT_VALUES.reduce((sum, value) => sum + ((c.probabilities[value] ?? 0) - (value === c.expected ? 1 : 0)) ** 2, 0)),
  );
}

/** Share of predicates on the right side of 0.5. */
export function binaryAccuracy(cases: PredicateCase[]): number {
  return mean(cases.map((c) => ((c.probability >= 0.5) === c.expected ? 1 : 0)));
}

/** Mean of (p − y)². 0 is perfect, 0.25 is a coin flip, 1 is worst. */
export function brierBinary(cases: PredicateCase[]): number {
  return mean(cases.map((c) => (c.probability - (c.expected ? 1 : 0)) ** 2));
}

/** Equal-width confidence bins and expected calibration error (ECE = Σ n_b/N · |acc_b − conf_b|). */
export function reliability(points: CalibrationPoint[], binCount = 5): { bins: ReliabilityBin[]; ece: number } {
  const bins = Array.from({ length: binCount }, (_, i) => {
    const from = round(i / binCount);
    const to = round((i + 1) / binCount);
    const inBin = points.filter((p) => p.confidence >= from && (i === binCount - 1 ? p.confidence <= to : p.confidence < to));
    return {
      from,
      to,
      count: inBin.length,
      avgConfidence: round(mean(inBin.map((p) => p.confidence))),
      accuracy: round(mean(inBin.map((p) => (p.correct ? 1 : 0)))),
    };
  });
  const ece = points.length === 0 ? 0 : bins.reduce((sum, b) => sum + (b.count / points.length) * Math.abs(b.accuracy - b.avgConfidence), 0);
  return { bins, ece };
}

/** Wrong answers, most confident first. */
export function confidentMisses<T extends { correct: boolean; confidence: number }>(items: T[], limit = 5): T[] {
  return items
    .filter((item) => !item.correct)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
