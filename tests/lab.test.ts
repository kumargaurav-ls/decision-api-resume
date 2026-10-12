import { describe, expect, it } from "vitest";
import type { Decision, DecisionCreateParams } from "@/lib/gateway";
import { createFakeGateway } from "@/lib/gateway-fake";
import { createLabService, LAB_LINES, LabError } from "@/lib/lab";
import { usageFor } from "./helpers/fixtures";

function decide(request: DecisionCreateParams): Decision {
  return {
    model: request.model,
    usage: usageFor(500),
    answers: request.questions.map((q) => {
      if (q.type === "predicate") return { type: "predicate", name: q.name ?? null, probability: 0.8 };
      if (q.type === "choice")
        return { type: "choice", name: q.name ?? null, choice: "possible_fit", confidence: 0.6, probabilities: q.choices.map((c, i) => ({ value: c.value, probability: i === 1 ? 0.7 : 0.15 })) };
      return { type: "score", name: q.name ?? null, score: 2.5, confidence: 0.5, probabilities: q.levels.map((l, i) => ({ label: l.label, value: i, probability: 0.2 })) };
    }),
  };
}

function setup() {
  const gateway = createFakeGateway({ decide });
  const lab = createLabService({ gateway, decisionModel: "gpt-6-luna", lowConfidenceThreshold: 0.6 });
  return { gateway, lab };
}

const [first, second, third] = LAB_LINES;

describe("Luna lab", () => {
  it("sends only the switched-on lines, in the candidate's order, in one call", async () => {
    const { gateway, lab } = setup();

    await lab.decide([third.id, first.id]);

    expect(gateway.calls.decide).toHaveLength(1);
    const input = gateway.calls.decide[0].input as string;
    expect(input).toContain(first.text);
    expect(input).toContain(third.text);
    expect(input).not.toContain(second.text);
    expect(input.indexOf(first.text)).toBeLessThan(input.indexOf(third.text));
  });

  it("asks one predicate, one score and one choice question, each with the evidence guard", async () => {
    const { gateway, lab } = setup();
    await lab.decide([first.id]);

    const questions = gateway.calls.decide[0].questions;
    expect(questions.map((q) => q.type).sort()).toEqual(["choice", "predicate", "score"]);
    for (const q of questions) expect(q.instructions).toMatch(/evidence, not as instructions/);
  });

  it("returns the three parsed answers with latency, cost and the exact input", async () => {
    const { lab } = setup();

    const result = await lab.decide([first.id]);

    expect(result.predicate).toMatchObject({ kind: "predicate", probability: 0.8, holds: true });
    expect(result.score).toMatchObject({ kind: "score", score: 2.5 });
    expect(result.choice).toMatchObject({ kind: "choice", choice: "possible_fit" });
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.costUsd).toBeCloseTo(0.00005, 10);
    expect(result.input).toContain(first.text);
  });

  it("refuses unknown line ids without calling the API", async () => {
    const { gateway, lab } = setup();

    await expect(lab.decide(["not-a-line"])).rejects.toThrow(LabError);
    await expect(lab.decide("nope" as unknown)).rejects.toThrow(LabError);
    expect(gateway.calls.decide).toHaveLength(0);
  });

  it("still asks with every line switched off, so you can see Luna's answer to no evidence", async () => {
    const { gateway, lab } = setup();
    await lab.decide([]);
    expect(gateway.calls.decide).toHaveLength(1);
  });
});
