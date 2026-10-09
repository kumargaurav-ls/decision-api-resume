import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Decision, DecisionCreateParams } from "@/lib/gateway";
import { AI_JD, usageFor, validRubricBody } from "./helpers/fixtures";
import { makeService } from "./helpers/service";
import { makeTempDataDir } from "./helpers/temp-dir";

const usage = usageFor(2000);

/** Answers every question: strong fit, mid scores, predicates true. */
function decideAll(request: DecisionCreateParams): Decision {
  return {
    model: request.model,
    usage,
    answers: request.questions.map((q) => {
      if (q.type === "predicate") return { type: "predicate", name: q.name ?? null, probability: 0.9 };
      if (q.type === "choice")
        return { type: "choice", name: q.name ?? null, choice: "strong_fit", confidence: 0.8, probabilities: q.choices.map((c, i) => ({ value: c.value, probability: i === 0 ? 0.8 : 0.1 })) };
      return { type: "score", name: q.name ?? null, score: 3, confidence: 0.7, probabilities: q.levels.map((l, i) => ({ label: l.label, value: i, probability: i === 3 ? 0.7 : 0.075 })) };
    }),
  };
}

const pdf = () => readFile(path.join(__dirname, "fixtures/files/resume.pdf"));

async function setup(decide: (r: DecisionCreateParams) => Decision | Promise<Decision> = decideAll) {
  const ctx = await makeService(await makeTempDataDir(), { draftRubric: () => validRubricBody(), decide });
  const role = await ctx.service.createRole({ title: "AI Engineer", jd: { kind: "paste", text: AI_JD } });
  return { ...ctx, role };
}

describe("role service — score resume", () => {
  it("makes exactly one Decisions call and saves the run with request, response, cost and rubric version", async () => {
    const { service, gateway, role } = await setup();
    await service.generateRubric(role.id);

    const run = await service.scoreResume(role.id, { fileName: "priya.pdf", bytes: await pdf() });

    expect(gateway.calls.decide).toHaveLength(1);
    const sent = gateway.calls.decide[0];
    expect(sent.model).toBe("gpt-6-luna");
    expect(sent.input).toContain("retrieval-augmented clinical notes assistant");
    expect(sent.questions).toHaveLength(12);
    expect(run).toMatchObject({
      roleId: role.id,
      rubricVersion: 1,
      resume: { fileName: "priya.pdf", kind: "pdf" },
      request: sent,
      error: null,
    });
    expect(run.costUsd).toBeCloseTo(0.0002, 10);
    expect(run.latencyMs).toBeGreaterThanOrEqual(0);
    expect(await service.listRunHistory(role.id)).toEqual([{ run, stale: false }]);
    expect(await service.getResumeText(role.id, run.id)).toContain("Priya Raman");
  });

  it("builds a scorecard for a saved run", async () => {
    const { service, role } = await setup();
    await service.generateRubric(role.id);
    const run = await service.scoreResume(role.id, { fileName: "priya.pdf", bytes: await pdf() });

    const view = await service.getRunView(role.id, run.id, 0.6);

    expect(view?.scorecard?.fit).toMatchObject({ kind: "choice", choice: "strong_fit", confidence: 0.8 });
    expect(view?.scorecard?.dimensions).toHaveLength(6);
    expect(view?.rubric?.version).toBe(1);
  });

  it("shows a refused question as refused and flags low-confidence answers", async () => {
    const { service, role } = await setup((request) => {
      const decision = decideAll(request);
      decision.answers = decision.answers.map((answer) => {
        if (answer.name === "dim.cloud_infra") return { type: "refusal", name: answer.name };
        if (answer.name === "fit" && answer.type === "choice") return { ...answer, confidence: 0.41 };
        return answer;
      });
      return decision;
    });
    await service.generateRubric(role.id);
    const run = await service.scoreResume(role.id, { fileName: "priya.pdf", bytes: await pdf() });

    const card = (await service.getRunView(role.id, run.id, 0.6))?.scorecard;

    expect(card?.dimensions.find((d) => d.key === "cloud_infra")?.answer).toEqual({ kind: "refusal" });
    expect(card?.dimensions.find((d) => d.key === "python_depth")?.answer.kind).toBe("score");
    expect(card?.fit).toMatchObject({ kind: "choice", lowConfidence: true });
  });

  it("refuses to score before a rubric exists", async () => {
    const { service, gateway, role } = await setup();

    await expect(service.scoreResume(role.id, { fileName: "priya.pdf", bytes: await pdf() })).rejects.toThrow(/generate a rubric first/i);
    expect(gateway.calls.decide).toHaveLength(0);
  });

  it("saves the run with the error when the API call fails", async () => {
    const { service, role } = await setup(() => {
      throw new Error("503 upstream unavailable");
    });
    await service.generateRubric(role.id);

    const run = await service.scoreResume(role.id, { fileName: "priya.pdf", bytes: await pdf() });

    expect(run.response).toBeNull();
    expect(run.error).toMatch(/503 upstream unavailable/);
    expect(run.costUsd).toBe(0);
    expect((await service.getRunView(role.id, run.id, 0.6))?.scorecard).toBeNull();
    expect(await service.listRunHistory(role.id)).toHaveLength(1);
  });
});
