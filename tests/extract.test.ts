import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, extractText } from "@/lib/extract";

const fixture = (name: string) => readFile(path.join(__dirname, "fixtures/files", name));

describe("text extraction", () => {
  it("extracts text from a text-based PDF", async () => {
    const result = await extractText({ fileName: "resume.pdf", bytes: await fixture("resume.pdf") });
    expect(result.kind).toBe("pdf");
    expect(result.text).toContain("retrieval-augmented clinical notes assistant");
  });

  it("extracts text from a DOCX", async () => {
    const result = await extractText({ fileName: "Resume.DOCX", bytes: await fixture("resume.docx") });
    expect(result.kind).toBe("docx");
    expect(result.text).toContain("Built Django data services processing 2M records a day.");
  });
});

describe("extraction guards", () => {
  it("rejects an image-only (scanned) PDF", async () => {
    await expect(extractText({ fileName: "scan.pdf", bytes: await fixture("scanned.pdf") })).rejects.toThrow(
      /no extractable text.*text-based PDF or DOCX/i,
    );
  });

  it("rejects a legacy .doc file with a specific message", async () => {
    await expect(extractText({ fileName: "legacy.doc", bytes: await fixture("legacy.doc") })).rejects.toThrow(/\.doc.*save it as \.docx/i);
  });

  it("rejects a DOCX with no text", async () => {
    await expect(extractText({ fileName: "empty.docx", bytes: await fixture("empty.docx") })).rejects.toThrow(/no extractable text/i);
  });

  it("rejects unsupported types", async () => {
    await expect(extractText({ fileName: "notes.txt", bytes: new Uint8Array([1]) })).rejects.toThrow(/isn't a PDF or DOCX/);
  });

  it("rejects files over 5 MB before parsing", async () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    await expect(extractText({ fileName: "big.pdf", bytes: big })).rejects.toThrow(/over the 5 MB limit/);
  });
});
