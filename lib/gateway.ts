import type { Decision, DecisionCreateParams } from "openai/resources/decisions";

/**
 * The single seam between the app and OpenAI. Nothing else imports the OpenAI SDK.
 * Tests (and mock mode) swap in a fake.
 */
export interface OpenAIGateway {
  /** Draft a rubric body from JD text. Returns unvalidated output; the service validates it. */
  draftRubric(jdText: string): Promise<unknown>;
  /** Send one Decisions API request and return the raw Decision. */
  decide(request: DecisionCreateParams): Promise<Decision>;
}

export type { Decision, DecisionCreateParams };
