/** Regenerates the binary test fixtures in tests/fixtures/files from resume.txt. */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderDocx, renderImageOnlyPdf, renderPdf } from "./render-documents";

const dir = path.join(process.cwd(), "tests/fixtures/files");

async function main() {
  const text = await readFile(path.join(dir, "resume.txt"), "utf8");
  await writeFile(path.join(dir, "resume.pdf"), await renderPdf(text));
  await writeFile(path.join(dir, "resume.docx"), await renderDocx(text));
  await writeFile(path.join(dir, "scanned.pdf"), await renderImageOnlyPdf());
  console.log("fixtures written to", dir);
}

void main();
