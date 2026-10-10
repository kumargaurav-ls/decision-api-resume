import type { DecisionCreateParams } from "../gateway";

export const DECISIONS_ENDPOINT = "https://api.openai.com/v1/decisions";

/**
 * curl command reproducing a stored request. The body goes through a quoted heredoc so
 * resume text with quotes, $ or backticks needs no escaping. The key comes from the env.
 */
export function toCurl(request: DecisionCreateParams): string {
  return [
    `curl ${DECISIONS_ENDPOINT} \\`,
    `  -H "Authorization: Bearer $OPENAI_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d @- <<'JSON'`,
    JSON.stringify(request, null, 2),
    `JSON`,
  ].join("\n");
}

/** TypeScript SDK snippet reproducing a stored request. `new OpenAI()` reads OPENAI_API_KEY. */
export function toTypeScript(request: DecisionCreateParams): string {
  return [
    `import OpenAI from "openai";`,
    ``,
    `const client = new OpenAI(); // reads OPENAI_API_KEY from the environment`,
    ``,
    `const decision = await client.decisions.create(${JSON.stringify(request, null, 2)});`,
    ``,
    `console.log(decision.answers);`,
  ].join("\n");
}
