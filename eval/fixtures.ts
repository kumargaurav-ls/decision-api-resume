import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { FIT_VALUES, Rubric } from "../lib/schemas/rubric";

const Label = z.object({
  profile: z.string().optional(),
  fit: z.enum(FIT_VALUES),
  mustHaves: z.record(z.string(), z.boolean()),
});
export type Label = z.infer<typeof Label>;

export type FixtureResume = { file: string; text: string };
export type Fixture = { name: string; jd: string; rubric: Rubric; labels: Record<string, Label>; resumes: FixtureResume[] };

/**
 * Loads every fixture under `dir`. Layout per fixture:
 *   <name>/jd.md, rubric.json (frozen), labels.json, resumes/*.md
 */
export async function loadFixtures(dir: string): Promise<Fixture[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const fixtures = await Promise.all(
    entries.filter((e) => e.isDirectory()).map((e) => loadFixture(path.join(dir, e.name), e.name)),
  );
  return fixtures.sort((a, b) => a.name.localeCompare(b.name));
}

async function loadFixture(dir: string, name: string): Promise<Fixture> {
  const [jd, rubricRaw, labelsRaw] = await Promise.all([
    readFile(path.join(dir, "jd.md"), "utf8"),
    readFile(path.join(dir, "rubric.json"), "utf8"),
    readFile(path.join(dir, "labels.json"), "utf8"),
  ]);
  const rubric = Rubric.parse(JSON.parse(rubricRaw));
  const labels = parseLabels(JSON.parse(labelsRaw), name);
  const files = (await readdir(path.join(dir, "resumes"))).filter((f) => f.endsWith(".md")).sort();
  const resumes = await Promise.all(
    files.map(async (file) => ({ file, text: await readFile(path.join(dir, "resumes", file), "utf8") })),
  );
  const unlabelled = resumes.filter((r) => !labels[r.file]).map((r) => r.file);
  if (unlabelled.length) throw new Error(`Fixture "${name}" has resumes without labels: ${unlabelled.join(", ")}`);
  return { name, jd, rubric, labels, resumes };
}

function parseLabels(raw: Record<string, unknown>, fixture: string): Record<string, Label> {
  const labels: Record<string, Label> = {};
  for (const [file, value] of Object.entries(raw)) {
    if (file.startsWith("_")) continue; // notes
    const parsed = Label.safeParse(value);
    if (!parsed.success) throw new Error(`Bad label for ${fixture}/${file}: ${parsed.error.issues[0]?.message}`);
    labels[file] = parsed.data;
  }
  return labels;
}
