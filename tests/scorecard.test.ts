import { describe, expect, it } from "vitest";
import { toScorecard } from "@/lib/decisions/scorecard";
import { costUsd } from "@/lib/decisions/cost";
import type { Decision } from "@/lib/gateway";
import type { Rubric } from "@/lib/schemas/rubric";
import { usageFor, validRubricBody } from "./helpers/fixtures";
import { LEVEL_LABELS } from "@/lib/schemas/rubric";

const body = validRubricBody();
const rubric: Rubric = {
  ...body,
  dimensions: body.dimensions.slice(0, 2),
  mustHaves: body.mustHaves.slice(0, 1),
  redFlags: body.redFlags.slice(0, 1),
  version: 1,
  createdAt: "2026-10-09T00:00:00.000Z",
  source: "generated",
};

const levels = (ps: number[]) => LEVEL_LABELS.map((label, value) => ({ label, value, probability: ps[value] }));
const usage = usageFor(3000);

// Answers deliberately out of question order: the parser must match by name.
const response: Decision = {
  model: "gpt-6-luna",
  usage,
  answers: [
    { type: "choice", name: "fit", choice: "strong_fit", confidence: 0.79, probabilities: [
      { value: "strong_fit", probability: 0.82 }, { value: "possible_fit", probability: 0.15 }, { value: "weak_fit", probability: 0.03 } ] },
    { type: "refusal", name: "dim.production_llm" },
    { type: "score", name: "dim.python_depth", score: 2.4, confidence: 0.45, probabilities: levels([0.05, 0.1, 0.3, 0.45, 0.1]) },
    { type: "predicate", name: "must.python_7y", probability: 0.93 },
    { type: "predicate", name: "flag.keyword_stuffing", probability: 0.55 },
  ],
};

describe("scorecard parser", () => {
  const card = toScorecard(rubric, response, 0.6);

  it("reads overall fit with every option's probability", () => {
    expect(card.fit).toEqual({
      kind: "choice",
      choice: "strong_fit",
      confidence: 0.79,
      lowConfidence: false,
      options: [
        { value: "strong_fit", probability: 0.82 },
        { value: "possible_fit", probability: 0.15 },
        { value: "weak_fit", probability: 0.03 },
      ],
    });
  });

  it("keeps fractional scores and flags low confidence", () => {
    const python = card.dimensions[0];
    expect(python.name).toBe("Python depth");
    expect(python.answer).toMatchObject({ kind: "score", score: 2.4, confidence: 0.45, lowConfidence: true });
    if (python.answer.kind === "score") expect(python.answer.levels.map((l) => l.probability)).toEqual([0.05, 0.1, 0.3, 0.45, 0.1]);
  });

  it("shows a refused question as refused while other answers still parse", () => {
    expect(card.dimensions[1]).toMatchObject({ key: "production_llm", answer: { kind: "refusal" } });
  });

  it("cuts predicates at 0.5 and marks near-even ones low confidence", () => {
    expect(card.mustHaves[0].answer).toEqual({ kind: "predicate", probability: 0.93, holds: true, lowConfidence: false });
    expect(card.redFlags[0].answer).toEqual({ kind: "predicate", probability: 0.55, holds: true, lowConfidence: true });
  });

  it("reports a question with no matching answer as missing", () => {
    const partial = toScorecard(rubric, { ...response, answers: response.answers.filter((a) => a.name !== "fit") }, 0.6);
    expect(partial.fit).toEqual({ kind: "missing" });
  });

  it("prices only input tokens at $0.10 per million", () => {
    expect(costUsd(usage)).toBeCloseTo(0.0003, 10);
  });
});
