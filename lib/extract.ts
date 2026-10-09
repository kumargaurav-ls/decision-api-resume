import mammoth from "mammoth";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

export type DocumentKind = "pdf" | "docx";
export type UploadedFile = { fileName: string; bytes: Uint8Array };
export type ExtractedText = { kind: DocumentKind; text: string; pages: number | null };

/** An extraction failure whose message is safe to show to the user. */
export class ExtractionError extends Error {}

export async function extractText(file: UploadedFile): Promise<ExtractedText> {
  const kind = documentKind(file.fileName);
  if (!kind) throw new ExtractionError(`"${file.fileName}" isn't a PDF or DOCX file.`);

  if (kind === "pdf") {
    // Copy: pdf.js transfers (detaches) the buffer it is given.
    const pdf = await getDocumentProxy(new Uint8Array(file.bytes));
    const { totalPages, text } = await extractPdfText(pdf, { mergePages: true });
    return { kind, text: normalise(text), pages: totalPages };
  }

  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file.bytes) });
  return { kind, text: normalise(value), pages: null };
}

function documentKind(fileName: string): DocumentKind | null {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";
  return null;
}

function normalise(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
