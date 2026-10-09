import { z } from "zod";
import { FIT_VALUES, LEVEL_LABELS, RUBRIC_LIMITS } from "../schemas/rubric";
import { EXAMPLE_JD_SUMMARY, EXAMPLE_RUBRIC } from "./example-rubric";

/**
 * Schema sent to the model via structured outputs. Deliberately relaxed (no exact
 * lengths, no ordering refinements) because strict JSON-schema mode may reject them;
 * the service enforces the full RubricBody schema afterwards and retries once.
 */
export const RubricDraftSchema = z.object({
  roleSummary: z.string(),
  dimensions: z.array(
    z.object({
      key: z.string(),
      name: z.string(),
      instructions: z.string(),
      levels: z.array(z.object({ label: z.enum(LEVEL_LABELS), description: z.string() })),
    }),
  ),
  mustHaves: z.array(z.object({ key: z.string(), statement: z.string() })),
  redFlags: z.array(z.object({ key: z.string(), statement: z.string() })),
  fit: z.object({
    instructions: z.string(),
    options: z.array(z.object({ value: z.enum(FIT_VALUES), description: z.string() })),
  }),
});

export const RUBRIC_SYSTEM_PROMPT = `You turn a job description into a screening rubric that will be asked of a resume as typed questions by a decision model.

Produce:
- roleSummary: 2–3 sentences describing the role, used as context for the overall-fit question.
- dimensions: ${RUBRIC_LIMITS.minDimensions}–${RUBRIC_LIMITS.maxDimensions} skills or experience areas the JD actually asks for. Each has a lowercase snake_case key, a short name, instructions saying what evidence to judge, and exactly five levels labelled in this order: ${LEVEL_LABELS.join(", ")}. Write each level description for this dimension specifically, as concrete evidence a resume would show (years, things built, scope owned).
- mustHaves: up to ${RUBRIC_LIMITS.maxMustHaves} hard requirements from the JD, each one atomic, true-or-false statement checkable from a resume ("The candidate has 5 or more years of professional React experience.").
- redFlags: up to ${RUBRIC_LIMITS.maxRedFlags} warning signs, each one atomic statement checkable from a resume (keyword stuffing, stale experience, claims unsupported by any role).
- fit: instructions plus exactly three options in this order: ${FIT_VALUES.join(", ")}, each with a description of when it applies.

Rules:
- Only use requirements the JD states or clearly implies. Do not invent requirements.
- Never use protected or proxy attributes: age, gender, nationality, ethnicity, religion, marital status, disability, photos, or college prestige.
- Judge evidence, not keywords: a skill only counts when a role description shows it being used.
- Keys must be unique within each list.

Example — for this role: "${EXAMPLE_JD_SUMMARY}" a good rubric is:
${JSON.stringify(EXAMPLE_RUBRIC, null, 2)}`;

export function rubricUserPrompt(jdText: string): string {
  return `Job description:\n"""\n${jdText}\n"""\n\nWrite the rubric for this role.`;
}
