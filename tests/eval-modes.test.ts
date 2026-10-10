import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateFixture } from "@/eval/evaluate";
import { loadFixtures } from "@/eval/fixtures";
import { renderReport } from "@/eval/report";
import { resolveFixturesDir } from "@/eval/run-options";
import { createFakeGateway } from "@/lib/gateway-fake";
import type { Decision, DecisionCreateParams } from "@/lib/gateway";
import { usageFor } from "./helpers/fixtures";
import { makeTempDataDir } from "./helpers/temp-dir";

const repoFixtures = path.join(__dirname, "..", "eval", "fixtures");

function weakAlways(request: DecisionCreateParams): Decision {
  return {
    model: request.model,
    usage: usageFor(1000),
    answers: request.questions.map((q) =>
      q.type === "choice"
        ? { type: "choice", name: q.name ?? null, choice: "weak_fit", confidence: 0.8, probabilities: q.choices.map((c) => ({ value: c.value, probability: c.value === "weak_fit" ? 0.8 : 0.1 })) }
        : q.type === "score"
          ? { type: "score", name: q.name ?? null, score: 1, confidence: 0.7, probabilities: q.levels.map((l, i) => ({ label: l.label, value: i, probability: l.label === "Basic" ? 0.7 : 0.075 })) }
          : { type: "predicate", name: q.name ?? null, probability: 0.1 },
    ),
  };
}

describe("eval options", () => {
  it("uses the repo fixtures by default", () => {
    expect(resolveFixturesDir({ private: false, privateEvalDir: null, cwd: "/repo" })).toEqual({ dir: "/repo/eval/fixtures", mode: "synthetic" });
  });

  it("uses PRIVATE_EVAL_DIR in private mode", () => {
    expect(resolveFixturesDir({ private: true, privateEvalDir: "/secret/evals", cwd: "/repo" })).toEqual({ dir: "/secret/evals", mode: "private" });
  });

  it("fails clearly in private mode when PRIVATE_EVAL_DIR is not set", () => {
    expect(() => resolveFixturesDir({ private: true, privateEvalDir: null, cwd: "/repo" })).toThrow(/PRIVATE_EVAL_DIR is not set/);
  });
});

describe("private fixtures", () => {
  it("extracts PDF/DOCX resumes with the app's guards and records rejected files as unanswered", async () => {
    const dir = await makeTempDataDir();
    const fixture = path.join(dir, "ai-engineer");
    await mkdir(path.join(fixture, "resumes"), { recursive: true });
    for (const file of ["jd.md", "rubric.json"]) await copyFile(path.join(repoFixtures, "ai-engineer", file), path.join(fixture, file));
    await copyFile(path.join(__dirname, "fixtures/files/resume.pdf"), path.join(fixture, "resumes", "real-candidate.pdf"));
    await copyFile(path.join(__dirname, "fixtures/files/scanned.pdf"), path.join(fixture, "resumes", "scanned-candidate.pdf"));
    await writeFile(
      path.join(fixture, "labels.json"),
      JSON.stringify({
        "real-candidate.pdf": { fit: "strong_fit", mustHaves: { python_7y: true, shipped_llm: true, aws_experience: true } },
        "scanned-candidate.pdf": { fit: "weak_fit", mustHaves: { python_7y: false, shipped_llm: false, aws_experience: false } },
      }),
    );

    const [loaded] = await loadFixtures(dir);
    expect(loaded.resumes.map((r) => [r.file, r.error === null])).toEqual([
      ["real-candidate.pdf", true],
      ["scanned-candidate.pdf", false],
    ]);
    expect(loaded.resumes[0].text).toContain("clinical notes assistant");

    const gateway = createFakeGateway({ decide: weakAlways });
    const result = await evaluateFixture(loaded, { gateway, dataDir: await makeTempDataDir() });
    expect(gateway.calls.decide).toHaveLength(1);
    expect(result.cases.find((c) => c.file === "scanned-candidate.pdf")).toMatchObject({ predicted: null, error: expect.stringMatching(/no extractable text/) });
    expect(result.metrics.unanswered).toBe(1);
  });
});

describe("report", () => {
  it("adds an overall row across fixtures", async () => {
    const fixtures = await loadFixtures(repoFixtures);
    expect(fixtures.map((f) => f.name)).toEqual(["ai-engineer", "react-dev"]);
    const results = await Promise.all(
      fixtures.map(async (f) => evaluateFixture(f, { gateway: createFakeGateway({ decide: weakAlways }), dataDir: await makeTempDataDir() })),
    );
    const report = renderReport(results, { mode: "synthetic", model: "gpt-6-luna" });
    // Always weak_fit: each fixture labels 7 of its 12 resumes weak_fit (draft labels) → 14 / 24 overall.
    expect(report).toMatch(/\| \*\*Overall\*\* \| 24 \| 58\.3% \|/);
    expect(report).toContain("## react-dev");
  });
});
