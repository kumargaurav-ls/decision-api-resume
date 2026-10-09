import { describe, expect, it } from "vitest";
import { buildDecisionRequest } from "@/lib/decisions/build-questions";
import { toScorecard } from "@/lib/decisions/scorecard";
import { loadConfig } from "@/lib/config";
import { createOpenAIGateway } from "@/lib/gateway-openai";
import { LEVEL_LABELS, RUBRIC_LIMITS, type Rubric } from "@/lib/schemas/rubric";
import { validRubricBody } from "./helpers/fixtures";

const live = process.env.RUN_LIVE === "1" && Boolean(process.env.OPENAI_API_KEY);

/** A rubric at every limit: 8 dimensions + 8 must-haves + 6 red flags + fit = 23 questions. */
function maxSizeRubric(): Rubric {
  const base = validRubricBody();
  const dimension = base.dimensions[0];
  return {
    ...base,
    dimensions: Array.from({ length: RUBRIC_LIMITS.maxDimensions }, (_, i) => ({
      ...dimension,
      key: `dimension_${i}`,
      levels: LEVEL_LABELS.map((label, j) => ({ label, description: dimension.levels[j].description })),
    })),
    mustHaves: Array.from({ length: RUBRIC_LIMITS.maxMustHaves }, (_, i) => ({ key: `must_${i}`, statement: base.mustHaves[i % base.mustHaves.length].statement })),
    redFlags: Array.from({ length: RUBRIC_LIMITS.maxRedFlags }, (_, i) => ({ key: `flag_${i}`, statement: base.redFlags[i % base.redFlags.length].statement })),
    version: 1,
    createdAt: new Date().toISOString(),
    source: "generated",
  };
}

describe.skipIf(!live)("live Decisions API smoke test (RUN_LIVE=1)", () => {
  it("accepts a maximum-size rubric and every answer type parses", async () => {
    const result = loadConfig();
    if (!result.ok || !result.config.openaiApiKey) throw new Error("Live test needs OPENAI_API_KEY");
    const { config } = result;
    const gateway = createOpenAIGateway({ apiKey: config.openaiApiKey!, rubricModel: config.rubricModel });
    const rubric = maxSizeRubric();
    const request = buildDecisionRequest(rubric, "Senior Python engineer, 8 years, shipped a RAG assistant on AWS.", config.decisionModel);
    expect(request.questions).toHaveLength(23);

    const response = await gateway.decide(request);

    expect(response.answers).toHaveLength(23);
    const card = toScorecard(rubric, response, 0.6);
    expect(["choice", "refusal"]).toContain(card.fit.kind);
    for (const { answer } of card.dimensions) expect(["score", "refusal"]).toContain(answer.kind);
    for (const { answer } of [...card.mustHaves, ...card.redFlags]) expect(["predicate", "refusal"]).toContain(answer.kind);
  }, 60_000);
});
