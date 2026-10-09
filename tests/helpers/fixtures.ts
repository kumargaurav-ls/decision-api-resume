import { EXAMPLE_RUBRIC } from "@/lib/rubric/example-rubric";
import type { RubricBody } from "@/lib/schemas/rubric";

/** A valid rubric body, deep-copied so tests can mutate it freely. */
export function validRubricBody(): RubricBody {
  return structuredClone(EXAMPLE_RUBRIC);
}

export const AI_JD = "We are hiring a Senior Applied AI Engineer to build production RAG systems in Python on AWS.";
