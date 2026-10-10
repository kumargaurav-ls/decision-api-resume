import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateFixture } from "@/eval/evaluate";
import { loadFixtures } from "@/eval/fixtures";
import { renderReport } from "@/eval/report";
import { createFakeGateway } from "@/lib/gateway-fake";
import type { Decision, DecisionCreateParams } from "@/lib/gateway";
import { usageFor } from "./helpers/fixtures";
import { makeTempDataDir } from "./helpers/temp-dir";

/** Always answers strong_fit at 0.9 and every predicate true at 0.9. */
function alwaysStrong(request: DecisionCreateParams): Decision {
  return {
    model: request.model,
    usage: usageFor(1500),
    answers: request.questions.map((q) =>
      q.type === "choice"
        ? { type: "choice", name: q.name ?? null, choice: "strong_fit", confidence: 0.9, probabilities: q.choices.map((c, i) => ({ value: c.value, probability: i === 0 ? 0.9 : 0.05 })) }
        : q.type === "score"
          ? { type: "score", name: q.name ?? null, score: 3, confidence: 0.6, probabilities: q.levels.map((l, i) => ({ label: l.label, value: i, probability: i === 3 ? 0.6 : 0.1 })) }
          : { type: "predicate", name: q.name ?? null, probability: 0.9 },
    ),
  };
}

const FIXTURES = path.join(__dirname, "..", "eval", "fixtures");

describe("eval runner", () => {
  it("loads the AI engineer fixture with a frozen rubric and a label for every resume", async () => {
    const fixtures = await loadFixtures(FIXTURES);
    const ai = fixtures.find((f) => f.name === "ai-engineer");
    expect(ai?.resumes).toHaveLength(12);
    expect(ai?.rubric.version).toBe(1);
    for (const resume of ai!.resumes) expect(ai!.labels[resume.file]).toBeDefined();
  });

  it("scores every resume through the service and computes metrics against the labels", async () => {
    const [ai] = (await loadFixtures(FIXTURES)).filter((f) => f.name === "ai-engineer");
    const gateway = createFakeGateway({ decide: alwaysStrong });

    const result = await evaluateFixture(ai, { gateway, dataDir: await makeTempDataDir() });

    expect(gateway.calls.decide).toHaveLength(12);
    expect(result.cases).toHaveLength(12);
    // 3 of the 12 labels are strong_fit.
    expect(result.metrics.fitAccuracy).toBeCloseTo(3 / 12);
    // 15 of the 36 must-have labels are true (3+3+3, 07: 2, 08: 2, 10: 2); everything is predicted true.
    expect(result.metrics.mustHaveAccuracy).toBeCloseTo(15 / 36);
    expect(result.cases.find((c) => c.file === "12-noah-brennan.md")?.predicted).toBe("strong_fit");
  });

  it("renders a markdown report with every required section", async () => {
    const [ai] = (await loadFixtures(FIXTURES)).filter((f) => f.name === "ai-engineer");
    const result = await evaluateFixture(ai, { gateway: createFakeGateway({ decide: alwaysStrong }), dataDir: await makeTempDataDir() });

    const report = renderReport([result], { mode: "synthetic", model: "gpt-6-luna" });

    for (const heading of ["Fit accuracy", "Confusion matrix", "Must-have accuracy", "Brier", "Reliability", "ECE", "Most confident misses"]) {
      expect(report).toContain(heading);
    }
    expect(report).toContain("12-noah-brennan.md");
  });
});
