import { MAX_UPLOAD_MB } from "@/lib/extract";

export const DOCUMENT_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const DOCUMENT_HINT = `Text-based PDF or DOCX, up to ${MAX_UPLOAD_MB} MB.`;

/** File input for PDF/DOCX uploads, styled consistently across forms. */
export function DocumentFileInput({ id, name }: { id: string; name: string }) {
  return (
    <input
      id={id}
      name={name}
      type="file"
      accept={DOCUMENT_ACCEPT}
      required
      className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
    />
  );
}
