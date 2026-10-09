import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AI_JD, validRubricBody } from "./helpers/fixtures";
import { makeService } from "./helpers/service";
import { makeTempDataDir } from "./helpers/temp-dir";

async function setupWithRubric() {
  const ctx = await makeService(await makeTempDataDir(), { draftRubric: () => validRubricBody() });
  const role = await ctx.service.createRole({ title: "AI Engineer", jd: { kind: "paste", text: AI_JD } });
  await ctx.service.generateRubric(role.id);
  return { ...ctx, role };
}

describe("role service — save edited rubric", () => {
  it("writes the next version marked edited and leaves the previous file byte-identical", async () => {
    const { service, role, dataDir } = await setupWithRubric();
    const v1Path = path.join(dataDir, "roles", role.id, "rubrics", "v1.json");
    const v1Before = await readFile(v1Path, "utf8");
    const edited = validRubricBody();
    edited.dimensions[0].levels[4].description = "Ten or more years leading Python platforms.";

    const v2 = await service.saveRubric(role.id, edited, 1);

    expect(v2).toMatchObject({ version: 2, source: "edited" });
    expect(v2.dimensions[0].levels[4].description).toBe("Ten or more years leading Python platforms.");
    expect((await service.getRole(role.id))?.currentRubricVersion).toBe(2);
    expect(await readFile(v1Path, "utf8")).toBe(v1Before);
  });

  it("rejects an invalid rubric with a user-facing message and writes nothing", async () => {
    const { service, role } = await setupWithRubric();
    const invalid = validRubricBody();
    invalid.dimensions = invalid.dimensions.slice(0, 2);

    await expect(service.saveRubric(role.id, invalid, 1)).rejects.toThrow(/dimensions/i);
    expect((await service.getRole(role.id))?.currentRubricVersion).toBe(1);
  });

  it("rejects duplicate keys", async () => {
    const { service, role } = await setupWithRubric();
    const invalid = validRubricBody();
    invalid.mustHaves[1].key = invalid.mustHaves[0].key;

    await expect(service.saveRubric(role.id, invalid, 1)).rejects.toThrow(/unique/i);
  });

  it("refuses a save made on a stale base version", async () => {
    const { service, role } = await setupWithRubric();
    await service.generateRubric(role.id); // someone regenerated: now v2

    await expect(service.saveRubric(role.id, validRubricBody(), 1)).rejects.toThrow(/changed since you opened it \(now v2\)/);
    expect((await service.getRole(role.id))?.currentRubricVersion).toBe(2);
  });

  it("rejects keys that are not snake_case", async () => {
    const { service, role } = await setupWithRubric();
    const invalid = validRubricBody();
    invalid.redFlags[0].key = "_bad__key";

    await expect(service.saveRubric(role.id, invalid, 1)).rejects.toThrow(/snake_case/);
  });
});
