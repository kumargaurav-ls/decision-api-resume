import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Role } from "./schemas/role";
import { Rubric } from "./schemas/rubric";
import { Run } from "./schemas/run";

/**
 * File-backed persistence. One directory per role:
 *   roles/<roleId>/role.json, jd.txt, rubrics/v<N>.json, runs/<runId>.json, runs/<runId>.resume.txt
 * Rubric versions are immutable once written.
 */
export function createStore(dataDir: string) {
  const roleDir = (roleId: string) => path.join(dataDir, "roles", safeId(roleId));
  const rubricPath = (roleId: string, version: number) =>
    path.join(roleDir(roleId), "rubrics", `v${version}.json`);
  const runPath = (roleId: string, runId: string) =>
    path.join(roleDir(roleId), "runs", `${safeId(runId)}.json`);
  const resumeTextPath = (roleId: string, runId: string) =>
    path.join(roleDir(roleId), "runs", `${safeId(runId)}.resume.txt`);

  return {
    async listRoles(): Promise<Role[]> {
      const ids = await listEntries(path.join(dataDir, "roles"), "dir");
      const roles = await Promise.all(ids.map((id) => this.getRole(id)));
      return roles.filter((role): role is Role => role !== null);
    },

    async getRole(roleId: string): Promise<Role | null> {
      if (!isValidId(roleId)) return null;
      return readParsed(path.join(roleDir(roleId), "role.json"), Role);
    },

    async saveRole(role: Role): Promise<void> {
      await writeAtomic(path.join(roleDir(role.id), "role.json"), JSON.stringify(role, null, 2));
    },

    async saveJdText(roleId: string, text: string): Promise<void> {
      await writeAtomic(path.join(roleDir(roleId), "jd.txt"), text);
    },

    async getJdText(roleId: string): Promise<string | null> {
      return readText(path.join(roleDir(roleId), "jd.txt"));
    },

    /** Writes a new rubric version. Refuses to overwrite an existing version. */
    async saveRubric(roleId: string, rubric: Rubric): Promise<void> {
      const file = rubricPath(roleId, rubric.version);
      if ((await readText(file)) !== null) {
        throw new Error(`Rubric v${rubric.version} already exists for role ${roleId}`);
      }
      await writeAtomic(file, JSON.stringify(rubric, null, 2));
    },

    async getRubric(roleId: string, version: number): Promise<Rubric | null> {
      return readParsed(rubricPath(roleId, version), Rubric);
    },

    async saveRun(run: Run, resumeText: string): Promise<void> {
      await writeAtomic(resumeTextPath(run.roleId, run.id), resumeText);
      await writeAtomic(runPath(run.roleId, run.id), JSON.stringify(run, null, 2));
    },

    async getRun(roleId: string, runId: string): Promise<Run | null> {
      if (!isValidId(roleId) || !isValidId(runId)) return null;
      return readParsed(runPath(roleId, runId), Run);
    },

    async getResumeText(roleId: string, runId: string): Promise<string | null> {
      return readText(resumeTextPath(roleId, runId));
    },

    async listRuns(roleId: string): Promise<Run[]> {
      const dir = path.join(roleDir(roleId), "runs");
      const files = (await listEntries(dir, "file")).filter((file) => file.endsWith(".json"));
      const runs = await Promise.all(files.map((file) => readParsed(path.join(dir, file), Run)));
      return runs.filter((run): run is Run => run !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  };
}

export type Store = ReturnType<typeof createStore>;

function isValidId(id: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(id);
}

/** Guards every path segment built from an id against traversal. */
function safeId(id: string): string {
  if (!isValidId(id)) throw new Error(`Invalid id: ${id}`);
  return id;
}

async function writeAtomic(file: string, contents: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, contents, "utf8");
  await rename(tmp, file);
}

async function readText(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

async function readParsed<T>(file: string, schema: { parse: (raw: unknown) => T }): Promise<T | null> {
  const text = await readText(file);
  return text === null ? null : schema.parse(JSON.parse(text));
}

async function listEntries(dir: string, kind: "dir" | "file"): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => (kind === "dir" ? entry.isDirectory() : entry.isFile()))
      .map((entry) => entry.name);
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}
