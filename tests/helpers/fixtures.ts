import { EXAMPLE_RUBRIC } from "@/lib/rubric/example-rubric";
import type { RubricBody } from "@/lib/schemas/rubric";

/** A valid rubric body, deep-copied so tests can mutate it freely. */
export function validRubricBody(): RubricBody {
  return structuredClone(EXAMPLE_RUBRIC);
}

/** Token usage block for fake Decision responses. */
export function usageFor(inputTokens: number) {
  return {
    input_tokens: inputTokens,
    input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
    output_tokens: 0,
    output_tokens_details: { reasoning_tokens: 0 },
    total_tokens: inputTokens,
  };
}

export const AI_JD = "We are hiring a Senior Applied AI Engineer to build production RAG systems in Python on AWS.";
