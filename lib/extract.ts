import mammoth from "mammoth";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

export type DocumentKind = "pdf" | "docx";
export type UploadedFile = { fileName: string; bytes: Uint8Array };
export type ExtractedText = { kind: DocumentKind; text: string; pages: number | null };

export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Below these, a PDF is treated as image-only (scanned): extraction found
 * almost no text, so scoring it would mean scoring blank input.
 */
const MIN_PDF_CHARS = 200;
const MIN_PDF_CHARS_PER_PAGE = 40;
/** Any document with less text than this is treated as empty. */
const MIN_DOCUMENT_CHARS = 50;

/** An extraction failure whose message is safe to show to the user. */
export class ExtractionError extends Error {}

export async function extractText(file: UploadedFile): Promise<ExtractedText> {
  const kind = documentKind(file.fileName);
  if (kind === "doc") {
    throw new ExtractionError(`"${file.fileName}" is a legacy .doc file — save it as .docx or PDF and upload again.`);
  }
  if (!kind) throw new ExtractionError(`"${file.fileName}" isn't a PDF or DOCX file.`);
  if (file.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ExtractionError(`"${file.fileName}" is over the ${MAX_UPLOAD_MB} MB limit.`);
  }

  if (kind === "pdf") {
    // Copy: pdf.js transfers (detaches) the buffer it is given.
    const pdf = await getDocumentProxy(new Uint8Array(file.bytes));
    const { totalPages, text } = await extractPdfText(pdf, { mergePages: true });
    const normalised = normaliseText(text);
    if (normalised.length < MIN_PDF_CHARS || normalised.length < MIN_PDF_CHARS_PER_PAGE * totalPages) {
      throw new ExtractionError(
        `"${file.fileName}" has no extractable text — it looks scanned or image-only. Upload a text-based PDF or DOCX.`,
      );
    }
    return { kind, text: normalised, pages: totalPages };
  }

  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(file.bytes) });
  const text = normaliseText(value);
  if (text.length < MIN_DOCUMENT_CHARS) {
    throw new ExtractionError(`"${file.fileName}" has no extractable text — it looks empty.`);
  }
  return { kind, text, pages: null };
}

function documentKind(fileName: string): DocumentKind | "doc" | null {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "pdf" || extension === "docx" || extension === "doc") return extension;
  return null;
}

/** LF line endings, no trailing spaces, at most one blank line in a row. */
export function normaliseText(text: string): string {
  return text.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
