import path from "node:path";

/** Which fixtures an eval run uses: the repo's synthetic set or a private set outside the repo. */
export type EvalMode = "synthetic" | "private";

/** Picks the fixtures directory: the repo's synthetic set, or a private set outside the repo. */
export function resolveFixturesDir(options: {
  private: boolean;
  privateEvalDir: string | null;
  cwd: string;
}): { dir: string; mode: EvalMode } {
  if (!options.private) return { dir: path.join(options.cwd, "eval", "fixtures"), mode: "synthetic" };
  if (!options.privateEvalDir) {
    throw new Error(
      "PRIVATE_EVAL_DIR is not set. Point it at a folder outside the repo with the same layout as eval/fixtures (<role>/jd.md, rubric.json, labels.json, resumes/).",
    );
  }
  return { dir: options.privateEvalDir, mode: "private" };
}
