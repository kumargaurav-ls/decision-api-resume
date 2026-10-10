/**
 * pnpm eval: score the labelled fixtures and write eval-report.md + eval-results.json.
 */
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { loadConfig } from "../lib/config";
import { createMockGateway } from "../lib/gateway-mock";
import { createOpenAIGateway } from "../lib/gateway-openai";
import { evaluateFixture } from "./evaluate";
import { loadFixtures } from "./fixtures";
import { pct, renderReport } from "./report";
import { resolveFixturesDir, type EvalMode } from "./run-options";

async function main() {
  loadEnvConfig(process.cwd());
  const result = loadConfig();
  if (!result.ok) {
    fail(`Missing or invalid settings: ${[...result.missing, ...result.invalid].join(", ")}. Set them in .env.local (or OPENAI_MOCK=1).`);
  }
  const { config } = result;

  let fixturesDir: string;
  let mode: EvalMode;
  try {
    ({ dir: fixturesDir, mode } = resolveFixturesDir({
      private: process.argv.includes("--private"),
      privateEvalDir: config.privateEvalDir,
      cwd: process.cwd(),
    }));
  } catch (error) {
    fail((error as Error).message);
  }
  const gateway = config.mockMode
    ? createMockGateway()
    : createOpenAIGateway({ apiKey: config.openaiApiKey!, rubricModel: config.rubricModel });

  const fixtures = await loadFixtures(fixturesDir);
  if (fixtures.length === 0) fail(`No fixtures found in ${fixturesDir}`);

  const dataDir = await mkdtemp(path.join(tmpdir(), "decision-eval-"));
  const results = [];
  for (const fixture of fixtures) {
    process.stdout.write(`Scoring ${fixture.name} (${fixture.resumes.length} resumes)… `);
    const r = await evaluateFixture(fixture, { gateway, dataDir, decisionModel: config.decisionModel });
    console.log(`fit ${pct(r.metrics.fitAccuracy)}, must-haves ${pct(r.metrics.mustHaveAccuracy)}, ECE ${r.metrics.ece.toFixed(3)}`);
    results.push(r);
  }

  const report = renderReport(results, { mode, model: config.decisionModel, mock: config.mockMode });
  await writeFile("eval-report.md", report);
  await writeFile("eval-results.json", JSON.stringify(results, null, 2) + "\n");
  console.log(`\nWrote eval-report.md and eval-results.json${config.mockMode ? " (mock mode: numbers are not meaningful)" : ""}.`);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
