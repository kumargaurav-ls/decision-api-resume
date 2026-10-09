import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export async function makeTempDataDir(): Promise<string> {
  return mkdtemp(path.join(tmpdir(), "decision-playground-"));
}
