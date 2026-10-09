import { zodTextFormat } from "openai/helpers/zod";
import { describe, expect, it } from "vitest";
import { EXAMPLE_RUBRIC } from "@/lib/rubric/example-rubric";
import { RUBRIC_SYSTEM_PROMPT, RubricDraftSchema } from "@/lib/rubric/prompt";
import { RubricBody } from "@/lib/schemas/rubric";

describe("rubric generation contract", () => {
  it("converts the draft schema to a strict structured-output format", () => {
    const format = zodTextFormat(RubricDraftSchema, "rubric");
    expect(format.type).toBe("json_schema");
    expect(format.strict).toBe(true);
    expect(format.schema).toMatchObject({ type: "object", required: expect.arrayContaining(["dimensions", "fit"]) });
  });

  it("uses an example rubric that satisfies the full rubric schema", () => {
    expect(RubricBody.safeParse(EXAMPLE_RUBRIC).success).toBe(true);
    expect(RubricDraftSchema.safeParse(EXAMPLE_RUBRIC).success).toBe(true);
  });

  it("tells the model not to use protected attributes", () => {
    expect(RUBRIC_SYSTEM_PROMPT).toMatch(/never use protected/i);
    expect(RUBRIC_SYSTEM_PROMPT).toMatch(/college prestige/);
  });
});
