import OpenAI from "openai";
import type { OpenAIGateway } from "./gateway";

/** Real gateway: the only place the OpenAI SDK is used. */
export function createOpenAIGateway({ apiKey }: { apiKey: string; rubricModel: string }): OpenAIGateway {
  const client = new OpenAI({ apiKey });
  return {
    async draftRubric() {
      throw new Error("Rubric generation is not implemented yet.");
    },
    async decide(request) {
      return client.decisions.create(request);
    },
  };
}
