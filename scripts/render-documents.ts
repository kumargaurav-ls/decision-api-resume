/**
 * Renders plain text into text-based PDF and DOCX files. Used to build test fixtures
 * (and, later, PDF/DOCX copies of synthetic eval resumes).
 *
 *   pnpm tsx scripts/render-documents.ts <input.txt|md> <out-without-extension>
 */
import { readFile, writeFile } from "node:fs/promises";
import { Document, Packer, Paragraph } from "docx";
import { PDFDocument, StandardFonts } from "pdf-lib";

export async function renderPdf(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 10.5;
  const margin = 56;
  const lineHeight = fontSize * 1.4;
  let page = pdf.addPage();
  const maxWidth = page.getWidth() - margin * 2;
  let y = page.getHeight() - margin;

  for (const line of wrap(sanitize(text), (s) => font.widthOfTextAtSize(s, fontSize), maxWidth)) {
    if (y < margin) {
      page = pdf.addPage();
      y = page.getHeight() - margin;
    }
    page.drawText(line, { x: margin, y, size: fontSize, font });
    y -= lineHeight;
  }
  return pdf.save();
}

export async function renderDocx(text: string): Promise<Uint8Array> {
  const doc = new Document({
    sections: [{ children: text.split("\n").map((line) => new Paragraph({ text: line })) }],
  });
  return new Uint8Array(await Packer.toBuffer(doc));
}

/** A PDF with pages but no text layer — what a scanned document looks like to an extractor. */
export async function renderImageOnlyPdf(pages = 2): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = pdf.addPage();
    page.drawRectangle({ x: 60, y: 400, width: 300, height: 200, borderWidth: 2 });
  }
  return pdf.save();
}

function sanitize(text: string): string {
  // Standard fonts only cover WinAnsi; replace the few typographic characters we use.
  return text.replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[•]/g, "-").replace(/[^\x00-\xFF\n]/g, "?");
}

function wrap(text: string, width: (s: string) => number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (width(candidate) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

async function main() {
  const [input, out] = process.argv.slice(2);
  if (!input || !out) {
    console.error("usage: tsx scripts/render-documents.ts <input> <out-without-extension>");
    process.exit(1);
  }
  const text = await readFile(input, "utf8");
  await writeFile(`${out}.pdf`, await renderPdf(text));
  await writeFile(`${out}.docx`, await renderDocx(text));
  console.log(`wrote ${out}.pdf and ${out}.docx`);
}

if (process.argv[1]?.endsWith("render-documents.ts")) void main();
