import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { OpenAIGateway } from "./gateway";
import { RUBRIC_SYSTEM_PROMPT, RubricDraftSchema, rubricUserPrompt } from "./rubric/prompt";

/** Real gateway: the only place the OpenAI SDK is used. */
export function createOpenAIGateway({ apiKey, rubricModel }: { apiKey: string; rubricModel: string }): OpenAIGateway {
  const client = new OpenAI({ apiKey });
  return {
    async draftRubric(jdText) {
      const response = await client.responses.parse({
        model: rubricModel,
        instructions: RUBRIC_SYSTEM_PROMPT,
        input: rubricUserPrompt(jdText),
        text: { format: zodTextFormat(RubricDraftSchema, "rubric") },
      });
      return response.output_parsed;
    },
    async decide(request) {
      return client.decisions.create(request);
    },
  };
}
