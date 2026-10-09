import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AI_JD, validRubricBody } from "./helpers/fixtures";
import { makeService } from "./helpers/service";
import { makeTempDataDir } from "./helpers/temp-dir";

async function setup(draftRubric: (jd: string) => unknown) {
  const ctx = await makeService(await makeTempDataDir(), { draftRubric });
  const role = await ctx.service.createRole({ title: "AI Engineer", jd: { kind: "paste", text: AI_JD } });
  return { ...ctx, role };
}

describe("role service — generate rubric", () => {
  it("drafts a rubric from the JD and saves it as version 1, marked generated", async () => {
    const { service, gateway, role, dataDir } = await setup(() => validRubricBody());

    const rubric = await service.generateRubric(role.id);

    expect(gateway.calls.draftRubric).toEqual([AI_JD]);
    expect(rubric).toMatchObject({ version: 1, source: "generated", roleSummary: validRubricBody().roleSummary });
    expect((await service.getRole(role.id))?.currentRubricVersion).toBe(1);
    expect(await service.getCurrentRubric(role.id)).toEqual(rubric);
    const onDisk = JSON.parse(await readFile(path.join(dataDir, "roles", role.id, "rubrics", "v1.json"), "utf8"));
    expect(onDisk).toEqual(rubric);
  });

  it("retries once when the model returns an invalid rubric", async () => {
    let call = 0;
    const { service, gateway, role } = await setup(() => (call++ === 0 ? { roleSummary: "missing everything" } : validRubricBody()));

    const rubric = await service.generateRubric(role.id);

    expect(gateway.calls.draftRubric).toHaveLength(2);
    expect(rubric.version).toBe(1);
  });

  it("fails with a clear error and saves nothing when output is invalid twice", async () => {
    const { service, gateway, role } = await setup(() => ({ dimensions: [] }));

    await expect(service.generateRubric(role.id)).rejects.toThrow(/invalid rubric/i);

    expect(gateway.calls.draftRubric).toHaveLength(2);
    expect((await service.getRole(role.id))?.currentRubricVersion).toBeNull();
    expect(await service.getCurrentRubric(role.id)).toBeNull();
  });

  it("reports a model refusal (null output) distinctly", async () => {
    const { service, role } = await setup(() => null);

    await expect(service.generateRubric(role.id)).rejects.toThrow(/declined to answer/);
  });

  it("rejects level labels out of order", async () => {
    const bad = validRubricBody();
    bad.dimensions[0].levels.reverse();
    const { service, role } = await setup(() => bad);

    await expect(service.generateRubric(role.id)).rejects.toThrow(/invalid rubric/i);
  });

  it("writes the next version when generating again", async () => {
    const { service, role } = await setup(() => validRubricBody());
    await service.generateRubric(role.id);

    const second = await service.generateRubric(role.id);

    expect(second.version).toBe(2);
    expect((await service.getRole(role.id))?.currentRubricVersion).toBe(2);
  });

  it("surfaces a gateway failure as a user-facing error", async () => {
    const { service, role } = await setup(() => {
      throw new Error("429 rate limited");
    });

    await expect(service.generateRubric(role.id)).rejects.toThrow(/couldn't draft a rubric.*429 rate limited/i);
  });
});
