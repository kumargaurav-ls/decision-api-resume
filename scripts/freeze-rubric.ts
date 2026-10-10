/**
 * Freezes a rubric for an eval fixture: reads a role's current rubric from DATA_DIR,
 * or falls back to the built-in example rubric, and writes it to the fixture folder.
 *
 *   pnpm tsx scripts/freeze-rubric.ts <fixture-dir> [roleId]
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { EXAMPLE_RUBRIC } from "../lib/rubric/example-rubric";
import type { Rubric } from "../lib/schemas/rubric";
import { loadEnvConfig } from "@next/env";
import { loadConfig } from "../lib/config";
import { createStore } from "../lib/store";

async function main() {
  const [fixtureDir, roleId] = process.argv.slice(2);
  if (!fixtureDir) throw new Error("usage: tsx scripts/freeze-rubric.ts <fixture-dir> [roleId]");
  let rubric: Rubric | null = null;
  if (roleId) {
    loadEnvConfig(process.cwd());
    const config = loadConfig();
    if (!config.ok) throw new Error(`Settings incomplete: ${[...config.missing, ...config.invalid].join(", ")}`);
    const store = createStore(config.config.dataDir);
    const role = await store.getRole(roleId);
    if (role?.currentRubricVersion) rubric = await store.getRubric(roleId, role.currentRubricVersion);
    if (!rubric) throw new Error(`No current rubric for role ${roleId}`);
  }
  // The example rubric is hand-written, so it is marked "edited" rather than "generated".
  rubric ??= { ...EXAMPLE_RUBRIC, version: 1, createdAt: new Date().toISOString(), source: "edited" };
  await writeFile(path.join(fixtureDir, "rubric.json"), JSON.stringify(rubric, null, 2) + "\n");
  console.log(`froze rubric v${rubric.version} into ${fixtureDir}/rubric.json`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
