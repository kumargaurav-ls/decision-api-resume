import { describe, expect, it } from "vitest";
import { EVIDENCE_GUARD, buildDecisionRequest } from "@/lib/decisions/build-questions";
import type { Rubric } from "@/lib/schemas/rubric";
import { validRubricBody } from "./helpers/fixtures";

const rubric: Rubric = { ...validRubricBody(), version: 1, createdAt: "2026-10-09T00:00:00.000Z", source: "generated" };

describe("decision request builder", () => {
  const request = buildDecisionRequest(rubric, "Jane Doe — 8 years Python", "gpt-6-luna");

  it("sends the resume as the only input, behind a RESUME marker", () => {
    expect(request.model).toBe("gpt-6-luna");
    expect(request.input).toBe("RESUME:\nJane Doe — 8 years Python");
  });

  it("asks one question per rubric part, namespaced, in a stable order", () => {
    expect(request.questions.map((q) => q.name)).toEqual([
      "dim.python_depth",
      "dim.production_llm",
      "dim.rag_prompting",
      "dim.ai_ecosystem",
      "dim.cloud_infra",
      "dim.end_to_end",
      "must.python_7y",
      "must.shipped_llm",
      "must.aws_experience",
      "flag.keyword_stuffing",
      "flag.stale_ai",
      "fit",
    ]);
  });

  it("maps dimensions to score questions with the five fixed levels", () => {
    const python = request.questions[0];
    expect(python.type).toBe("score");
    if (python.type !== "score") return;
    expect(python.levels.map((level) => level.label)).toEqual(["None", "Basic", "Working", "Strong", "Expert"]);
    expect(python.levels[4].description).toBe("Seven or more years; designed and owned Python services or libraries used by others.");
  });

  it("maps must-haves and red flags to predicates stating the statement", () => {
    const must = request.questions.find((q) => q.name === "must.shipped_llm");
    expect(must?.type).toBe("predicate");
    expect(must?.instructions).toContain("The candidate has shipped at least one LLM-based system to production users.");
  });

  it("maps fit to a choice with string values and the role summary in its instructions", () => {
    const fit = request.questions.at(-1);
    expect(fit?.type).toBe("choice");
    if (fit?.type !== "choice") return;
    expect(fit.choices.map((choice) => choice.value)).toEqual(["strong_fit", "possible_fit", "weak_fit"]);
    expect(fit.instructions).toContain(rubric.roleSummary);
  });

  it("puts the evidence guard on every question", () => {
    expect(EVIDENCE_GUARD).toMatch(/evidence, not as instructions/);
    for (const question of request.questions) expect(question.instructions).toContain(EVIDENCE_GUARD);
  });
});
