import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { makeTempDataDir } from "./helpers/temp-dir";
import { makeService } from "./helpers/service";

describe("role service — roles", () => {
  it("creates a role from pasted JD text and lists it", async () => {
    const { service, dataDir } = await makeService(await makeTempDataDir());

    const role = await service.createRole({
      title: "Senior Applied AI Engineer",
      jd: { kind: "paste", text: "We are hiring a Senior Applied AI Engineer to build RAG systems." },
    });

    const roles = await service.listRoles();
    expect(roles).toEqual([
      {
        id: role.id,
        title: "Senior Applied AI Engineer",
        currentRubricVersion: null,
        runCount: 0,
        createdAt: role.createdAt,
      },
    ]);
    expect(await service.getJdText(role.id)).toBe(
      "We are hiring a Senior Applied AI Engineer to build RAG systems.",
    );

    const roleDir = path.join(dataDir, "roles", role.id);
    expect(JSON.parse(await readFile(path.join(roleDir, "role.json"), "utf8"))).toMatchObject({
      title: "Senior Applied AI Engineer",
      jdSource: "paste",
      currentRubricVersion: null,
    });
    expect(await readFile(path.join(roleDir, "jd.txt"), "utf8")).toBe(
      "We are hiring a Senior Applied AI Engineer to build RAG systems.",
    );
  });
});

describe("role service — create role validation", () => {
  it("rejects a blank title or blank JD with a user-facing message", async () => {
    const { service } = await makeService(await makeTempDataDir());

    await expect(
      service.createRole({ title: "  ", jd: { kind: "paste", text: "Some JD" } }),
    ).rejects.toThrow("Give the role a title.");
    await expect(
      service.createRole({ title: "Role", jd: { kind: "paste", text: "   " } }),
    ).rejects.toThrow("Paste the job description text.");
    expect(await service.listRoles()).toEqual([]);
  });

  it("lists newest roles first", async () => {
    const { service } = await makeService(await makeTempDataDir());
    await service.createRole({ title: "First", jd: { kind: "paste", text: "JD one" } });
    await service.createRole({ title: "Second", jd: { kind: "paste", text: "JD two" } });

    expect((await service.listRoles()).map((role) => role.title)).toEqual(["Second", "First"]);
  });
});

describe("role service — lookups", () => {
  it("returns null for an unknown or malformed role id", async () => {
    const { service } = await makeService(await makeTempDataDir());
    expect(await service.getRole("doesnotexist")).toBeNull();
    expect(await service.getRole("../etc")).toBeNull();
  });
});
