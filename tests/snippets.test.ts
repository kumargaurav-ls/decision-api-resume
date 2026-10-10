import { describe, expect, it } from "vitest";
import { DECISIONS_ENDPOINT, toCurl, toTypeScript } from "@/lib/decisions/snippets";
import type { DecisionCreateParams } from "@/lib/gateway";

const request: DecisionCreateParams = {
  model: "gpt-6-luna",
  input: "RESUME:\nIt's 'quoted' — and has $dollars and `ticks`",
  questions: [{ type: "predicate", name: "must.python_7y", instructions: "The candidate has 7+ years of Python." }],
};

/** The JSON body between the first "{" line and its matching last "}" — independent of the builder. */
function bodyOf(snippet: string, open: string, close: string): unknown {
  const start = snippet.indexOf(open) + open.length;
  const end = snippet.lastIndexOf(close);
  return JSON.parse(snippet.slice(start, end));
}

describe("dev panel snippets", () => {
  it("builds a curl command that reproduces the exact request body", () => {
    const curl = toCurl(request);
    expect(DECISIONS_ENDPOINT).toBe("https://api.openai.com/v1/decisions");
    expect(curl).toContain(DECISIONS_ENDPOINT);
    expect(curl).toContain('-H "Authorization: Bearer $OPENAI_API_KEY"');
    expect(bodyOf(curl, "<<'JSON'\n", "\nJSON")).toEqual(request);
  });

  it("builds a TypeScript SDK snippet that reproduces the exact request body", () => {
    const ts = toTypeScript(request);
    expect(ts).toContain('import OpenAI from "openai";');
    expect(ts).toContain("new OpenAI()");
    expect(bodyOf(ts, "client.decisions.create(", ");\n")).toEqual(request);
  });

  it("keeps the heredoc intact even if the resume has a line that is exactly JSON", () => {
    const tricky = { ...request, input: "RESUME:\nline one\nJSON\nline two" };
    const curl = toCurl(tricky);
    // Only the closing terminator line may be exactly "JSON".
    expect(curl.split("\n").filter((line) => line === "JSON")).toHaveLength(1);
    expect(bodyOf(curl, "<<'JSON'\n", "\nJSON")).toEqual(tricky);
  });

  it("never inlines an API key", () => {
    for (const snippet of [toCurl(request), toTypeScript(request)]) expect(snippet).not.toMatch(/sk-[A-Za-z0-9]/);
  });
});
