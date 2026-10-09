import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "@/lib/extract";
import { AI_JD, validRubricBody } from "./helpers/fixtures";
import { makeService } from "./helpers/service";
import { makeTempDataDir } from "./helpers/temp-dir";

const fixture = (name: string) => readFile(path.join(__dirname, "fixtures/files", name));

describe("role service — documents", () => {
  it("previews an uploaded JD's text with its kind and length", async () => {
    const { service } = await makeService(await makeTempDataDir());

    const preview = await service.previewDocument({ fileName: "jd.docx", bytes: await fixture("resume.docx") }); // any text DOCX works as a JD

    expect(preview.kind).toBe("docx");
    expect(preview.text).toContain("Senior ML Engineer");
    expect(preview.chars).toBe(preview.text.length);
  });

  it("turns an extraction failure into a user-facing error", async () => {
    const { service } = await makeService(await makeTempDataDir());
    await expect(service.previewDocument({ fileName: "scan.pdf", bytes: await fixture("scanned.pdf") })).rejects.toThrow(
      /no extractable text/i,
    );
  });

  it("stores JD text with LF line endings (forms submit CRLF)", async () => {
    const { service } = await makeService(await makeTempDataDir());
    const role = await service.createRole({ title: "Role", jd: { kind: "docx", text: "Line one\r\nLine two\r\n" } });
    expect(await service.getJdText(role.id)).toBe("Line one\nLine two");
  });

  it("records where the JD came from", async () => {
    const { service } = await makeService(await makeTempDataDir());
    const role = await service.createRole({ title: "From PDF", jd: { kind: "pdf", text: "Extracted JD text" } });
    expect((await service.getRole(role.id))?.jdSource).toBe("pdf");
  });

  it.each([
    ["scanned.pdf", /no extractable text/i],
    ["legacy.doc", /legacy \.doc/i],
    ["empty.docx", /looks empty/i],
  ])("rejects %s as a resume without calling the Decisions API", async (name, message) => {
    const { service, gateway } = await makeService(await makeTempDataDir(), {
      draftRubric: () => validRubricBody(),
      decide: () => {
        throw new Error("should not be called");
      },
    });
    const role = await service.createRole({ title: "AI", jd: { kind: "paste", text: AI_JD } });
    await service.generateRubric(role.id);

    await expect(service.scoreResume(role.id, { fileName: name, bytes: await fixture(name) })).rejects.toThrow(message);
    expect(gateway.calls.decide).toHaveLength(0);
  });

  it("rejects an oversized resume without calling the Decisions API", async () => {
    const { service, gateway } = await makeService(await makeTempDataDir(), { draftRubric: () => validRubricBody() });
    const role = await service.createRole({ title: "AI", jd: { kind: "paste", text: AI_JD } });
    await service.generateRubric(role.id);

    await expect(
      service.scoreResume(role.id, { fileName: "big.pdf", bytes: new Uint8Array(MAX_UPLOAD_BYTES + 1) }),
    ).rejects.toThrow(/over the 5 MB limit/);
    expect(gateway.calls.decide).toHaveLength(0);
  });

  it("rejects a scanned resume without calling the Decisions API", async () => {
    const { service, gateway } = await makeService(await makeTempDataDir(), {
      draftRubric: () => validRubricBody(),
      decide: () => {
        throw new Error("should not be called");
      },
    });
    const role = await service.createRole({ title: "AI", jd: { kind: "paste", text: AI_JD } });
    await service.generateRubric(role.id);

    await expect(service.scoreResume(role.id, { fileName: "scan.pdf", bytes: await fixture("scanned.pdf") })).rejects.toThrow(
      /no extractable text/i,
    );
    expect(gateway.calls.decide).toHaveLength(0);
    expect(await service.listRunHistory(role.id)).toEqual([]);
  });
});
