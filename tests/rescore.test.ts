import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Decision, DecisionCreateParams } from "@/lib/gateway";
import { AI_JD, usageFor, validRubricBody } from "./helpers/fixtures";
import { makeService } from "./helpers/service";
import { makeTempDataDir } from "./helpers/temp-dir";

function decideAll(request: DecisionCreateParams): Decision {
  return {
    model: request.model,
    usage: usageFor(1000),
    answers: request.questions.map((q) =>
      q.type === "choice"
        ? { type: "choice", name: q.name ?? null, choice: "possible_fit", confidence: 0.7, probabilities: q.choices.map((c) => ({ value: c.value, probability: 1 / 3 })) }
        : q.type === "score"
          ? { type: "score", name: q.name ?? null, score: 2, confidence: 0.7, probabilities: q.levels.map((l, i) => ({ label: l.label, value: i, probability: 0.2 })) }
          : { type: "predicate", name: q.name ?? null, probability: 0.5 },
    ),
  };
}

async function setupWithRun() {
  const ctx = await makeService(await makeTempDataDir(), { draftRubric: () => validRubricBody(), decide: decideAll });
  const role = await ctx.service.createRole({ title: "AI Engineer", jd: { kind: "paste", text: AI_JD } });
  await ctx.service.generateRubric(role.id);
  const bytes = await readFile(path.join(__dirname, "fixtures/files/resume.pdf"));
  const run = await ctx.service.scoreResume(role.id, { fileName: "priya.pdf", bytes });
  return { ...ctx, role, run };
}

describe("role service — stale runs and re-score", () => {
  it("marks runs scored on an older rubric version as stale", async () => {
    const { service, role, run } = await setupWithRun();
    expect(await service.listRunHistory(role.id)).toEqual([{ run, stale: false }]);

    const edited = validRubricBody();
    edited.mustHaves = edited.mustHaves.slice(0, 1);
    await service.saveRubric(role.id, edited, 1);

    expect(await service.listRunHistory(role.id)).toEqual([{ run, stale: true }]);
    expect((await service.getRunView(role.id, run.id, 0.6))?.stale).toBe(true);
  });

  it("re-scores the stored resume text against the current rubric as a new run", async () => {
    const { service, gateway, role, run, dataDir } = await setupWithRun();
    const runFile = path.join(dataDir, "roles", role.id, "runs", `${run.id}.json`);
    const before = await readFile(runFile, "utf8");
    const edited = validRubricBody();
    edited.mustHaves = edited.mustHaves.slice(0, 1);
    await service.saveRubric(role.id, edited, 1);

    const rescored = await service.rescoreRun(role.id, run.id);

    expect(rescored.id).not.toBe(run.id);
    expect(rescored).toMatchObject({ rubricVersion: 2, resume: run.resume, error: null });
    expect(gateway.calls.decide).toHaveLength(2);
    expect(gateway.calls.decide[1].input).toBe(gateway.calls.decide[0].input);
    expect(gateway.calls.decide[1].questions).toHaveLength(10);
    expect(await readFile(runFile, "utf8")).toBe(before);
    expect((await service.listRunHistory(role.id)).map((item) => [item.run.id, item.stale])).toEqual([
      [rescored.id, false],
      [run.id, true],
    ]);
  });

  it("refuses to re-score a run that doesn't exist", async () => {
    const { service, role } = await setupWithRun();
    await expect(service.rescoreRun(role.id, "nope")).rejects.toThrow(/run no longer exists/i);
  });
});
