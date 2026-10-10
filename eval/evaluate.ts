import { runDecision, toScorecard } from "../lib/decisions/scorecard";
import type { OpenAIGateway } from "../lib/gateway";
import { createRoleService } from "../lib/role-service";
import type { FitValue } from "../lib/schemas/rubric";
import { createStore } from "../lib/store";
import type { Fixture } from "./fixtures";
import {
  brierBinary,
  brierMulticlass,
  confidentMisses,
  confusionMatrix,
  reliability,
  type ReliabilityBin,
} from "./metrics";

export type EvalCase = {
  file: string;
  profile: string | null;
  expected: FitValue;
  /** Null when the call failed or the fit question was refused. */
  predicted: FitValue | null;
  confidence: number;
  probabilities: Record<string, number>;
  mustHaves: { key: string; expected: boolean; probability: number | null }[];
  error: string | null;
};

export type FixtureResult = {
  fixture: string;
  rubricVersion: number;
  cases: EvalCase[];
  metrics: {
    fitAccuracy: number;
    /** Raw counts behind the accuracies, so totals across fixtures stay exact. */
    counts: { fitCorrect: number; fitTotal: number; mustHaveCorrect: number; mustHaveTotal: number };
    confusion: number[][];
    mustHaveAccuracy: number;
    brierFit: number;
    brierMustHaves: number;
    reliability: ReliabilityBin[];
    ece: number;
    misses: { file: string; kind: "fit" | "must-have"; detail: string; confidence: number }[];
    /** Fit questions with no answer (refused, missing or failed call); counted wrong. */
    unanswered: number;
    /** Must-have questions with no answer; counted wrong in accuracy, excluded from Brier. */
    unansweredMustHaves: number;
  };
};

/**
 * Scores every resume of a fixture through the role service (same path as the app),
 * using the fixture's frozen rubric, then compares answers with the labels.
 */
export async function evaluateFixture(
  fixture: Fixture,
  { gateway, dataDir, decisionModel }: { gateway: OpenAIGateway; dataDir: string; decisionModel?: string },
): Promise<FixtureResult> {
  const service = createRoleService({ store: createStore(dataDir), gateway, decisionModel });
  const role = await service.createRole({ title: `eval: ${fixture.name}`, jd: { kind: "paste", text: fixture.jd } });
  await service.installRubric(role.id, fixture.rubric);

  const cases: EvalCase[] = [];
  for (const resume of fixture.resumes) {
    const label = fixture.labels[resume.file];
    // Files the extractor rejected are never scored; they become unanswered cases.
    const run = resume.text === null ? null : await service.scoreResumeText(role.id, { fileName: resume.file, text: resume.text });
    const decision = run ? runDecision(run) : null;
    const card = decision ? toScorecard(fixture.rubric, decision, 0) : null;
    const fit = card?.fit.kind === "choice" ? card.fit : null;
    cases.push({
      file: resume.file,
      profile: label.profile ?? null,
      expected: label.fit,
      predicted: (fit?.choice as FitValue | undefined) ?? null,
      confidence: fit?.confidence ?? 0,
      probabilities: Object.fromEntries((fit?.options ?? []).map((o) => [o.value, o.probability])),
      mustHaves: Object.entries(label.mustHaves).map(([key, expected]) => {
        const answer = card?.mustHaves.find((m) => m.key === key)?.answer;
        return { key, expected, probability: answer?.kind === "predicate" ? answer.probability : null };
      }),
      error: resume.error ?? run?.error ?? null,
    });
  }
  return { fixture: fixture.name, rubricVersion: fixture.rubric.version, cases, metrics: computeMetrics(cases) };
}

function computeMetrics(cases: EvalCase[]): FixtureResult["metrics"] {
  const answered = cases.filter((c): c is EvalCase & { predicted: FitValue } => c.predicted !== null);
  const allPredicates = cases.flatMap((c) => c.mustHaves.map((m) => ({ file: c.file, ...m })));
  const predicates = allPredicates.filter(
    (p): p is typeof p & { probability: number } => p.probability !== null,
  );
  const { bins, ece } = reliability(answered.map((c) => ({ confidence: c.confidence, correct: c.expected === c.predicted })));

  const fitMisses = answered.map((c) => ({
    file: c.file,
    kind: "fit" as const,
    detail: `expected ${c.expected}, got ${c.predicted}`,
    confidence: c.confidence,
    correct: c.expected === c.predicted,
  }));
  const predicateMisses = predicates.map((p) => ({
    file: p.file,
    kind: "must-have" as const,
    detail: `${p.key}: expected ${p.expected}, p=${p.probability.toFixed(2)}`,
    confidence: Math.max(p.probability, 1 - p.probability),
    correct: (p.probability >= 0.5) === p.expected,
  }));

  const fitCorrect = answered.filter((c) => c.expected === c.predicted).length;
  const mustHaveCorrect = predicates.filter((p) => (p.probability >= 0.5) === p.expected).length;

  return {
    counts: { fitCorrect, fitTotal: cases.length, mustHaveCorrect, mustHaveTotal: allPredicates.length },
    // Unanswered fits count as wrong: the accuracy is over every labelled resume.
    fitAccuracy: cases.length ? fitCorrect / cases.length : 0,
    confusion: confusionMatrix(answered),
    // Unanswered must-haves count as wrong, like unanswered fits.
    mustHaveAccuracy: allPredicates.length ? mustHaveCorrect / allPredicates.length : 0,
    brierFit: brierMulticlass(answered),
    brierMustHaves: brierBinary(predicates),
    reliability: bins,
    ece,
    misses: confidentMisses([...fitMisses, ...predicateMisses], 5).map(({ correct: _correct, ...rest }) => rest),
    unanswered: cases.length - answered.length,
    unansweredMustHaves: allPredicates.length - predicates.length,
  };
}
