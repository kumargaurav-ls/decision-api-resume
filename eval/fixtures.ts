import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { DOCUMENT_EXTENSIONS, ExtractionError, extractText, normaliseText } from "../lib/extract";
import { FIT_VALUES, Rubric } from "../lib/schemas/rubric";

const Label = z.object({
  profile: z.string().optional(),
  fit: z.enum(FIT_VALUES),
  mustHaves: z.record(z.string(), z.boolean()),
});
export type Label = z.infer<typeof Label>;

/** A resume's text, or why it couldn't be read (rejected files are scored as unanswered). */
export type FixtureResume = { file: string } & ({ text: string; error: null } | { text: null; error: string });
export type Fixture = { name: string; jd: string; rubric: Rubric; labels: Record<string, Label>; resumes: FixtureResume[] };

const TEXT_EXTENSIONS = [".md", ".txt"];
const SUPPORTED_EXTENSIONS: readonly string[] = [...TEXT_EXTENSIONS, ...DOCUMENT_EXTENSIONS];

/**
 * Loads every fixture under `dir`. Layout per fixture:
 *   <name>/jd.md, rubric.json (frozen), labels.json, resumes/*.{md,txt,pdf,docx}
 * PDF/DOCX resumes go through the app's extractor and its guards.
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
  const resumesDir = path.join(dir, "resumes");
  const files = (await readdir(resumesDir)).filter((f) => SUPPORTED_EXTENSIONS.includes(extensionOf(f))).sort();
  const resumes = await Promise.all(files.map((file) => readResume(resumesDir, file)));
  const unlabelled = resumes.filter((r) => !labels[r.file]).map((r) => r.file);
  if (unlabelled.length) throw new Error(`Fixture "${name}" has resumes without labels: ${unlabelled.join(", ")}`);
  return { name, jd, rubric, labels, resumes };
}

async function readResume(dir: string, file: string): Promise<FixtureResume> {
  const filePath = path.join(dir, file);
  if (TEXT_EXTENSIONS.includes(extensionOf(file))) {
    return { file, text: normaliseText(await readFile(filePath, "utf8")), error: null };
  }
  try {
    const extracted = await extractText({ fileName: file, bytes: new Uint8Array(await readFile(filePath)) });
    return { file, text: extracted.text, error: null };
  } catch (error) {
    if (error instanceof ExtractionError) return { file, text: null, error: error.message };
    throw error;
  }
}

function extensionOf(file: string): string {
  return path.extname(file).toLowerCase();
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
