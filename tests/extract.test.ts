import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractText } from "@/lib/extract";

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
