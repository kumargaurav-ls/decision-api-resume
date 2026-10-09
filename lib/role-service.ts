import { randomUUID } from "node:crypto";
import type { OpenAIGateway } from "./gateway";
import { Role, type JdSource } from "./schemas/role";
import { RubricBody, type Rubric } from "./schemas/rubric";
import type { Run } from "./schemas/run";
import { buildDecisionRequest } from "./decisions/build-questions";
import { costUsd } from "./decisions/cost";
import { runDecision, toScorecard, type Scorecard } from "./decisions/scorecard";
import { ExtractionError, extractText, normaliseText, type DocumentKind, type UploadedFile } from "./extract";
import { DEFAULT_DECISION_MODEL } from "./config";
import type { Decision } from "./gateway";
import type { Store } from "./store";

/** One attempt plus one retry when the model's rubric fails full validation. */
const MAX_DRAFT_ATTEMPTS = 2;

export type RoleSummary = {
  id: string;
  title: string;
  currentRubricVersion: number | null;
  runCount: number;
  createdAt: string;
};

/** JD text plus where it came from (pasted, or extracted from an uploaded file). */
export type JdInput = { kind: JdSource; text: string };

export type DocumentPreview = { kind: DocumentKind; text: string; chars: number };

/** A run with the rubric it was scored on (null if that file is gone) and its parsed scorecard. */
export type RunHistoryItem = { run: Run; stale: boolean };

export type RunView = {
  run: Run;
  rubric: Rubric | null;
  scorecard: Scorecard | null;
  resumeText: string | null;
  /** Scored on an older rubric version than the role's current one. */
  stale: boolean;
};

type RoleServiceDeps = {
  store: Store;
  gateway: OpenAIGateway;
  decisionModel?: string;
  now?: () => Date;
  newId?: () => string;
};

export function createRoleService({
  store,
  gateway,
  decisionModel = DEFAULT_DECISION_MODEL,
  now = () => new Date(),
  newId = shortId,
}: RoleServiceDeps) {
  async function requireRole(roleId: string): Promise<Role> {
    const role = await store.getRole(roleId);
    if (!role) throw new ServiceError("That role no longer exists.");
    return role;
  }

  async function requireCurrentRubric(roleId: string): Promise<Rubric> {
    const role = await requireRole(roleId);
    if (!role.currentRubricVersion) throw new ServiceError("Generate a rubric first.");
    const rubric = await store.getRubric(roleId, role.currentRubricVersion);
    if (!rubric) throw new ServiceError("This role's current rubric is missing on disk.");
    return rubric;
  }

  /** One Decisions call for one resume; the run is saved even when the call fails. */
  async function decideAndSave(
    roleId: string,
    rubric: Rubric,
    resume: Pick<Run["resume"], "fileName" | "kind">,
    resumeText: string,
  ): Promise<Run> {
    const request = buildDecisionRequest(rubric, resumeText, decisionModel);
    const started = performance.now();
    let response: Decision | null = null;
    let error: string | null = null;
    try {
      response = await gateway.decide(request);
    } catch (caught) {
      error = errorMessage(caught);
    }
    const latencyMs = Math.round(performance.now() - started);

    const run: Run = {
      id: newId(),
      roleId,
      rubricVersion: rubric.version,
      createdAt: now().toISOString(),
      resume: { ...resume, chars: resumeText.length },
      request,
      response,
      latencyMs,
      costUsd: response ? costUsd(response.usage) : 0,
      error,
    };
    await store.saveRun(run, resumeText);
    return run;
  }

  /** Writes the next rubric version and points the role at it. */
  async function saveNextRubric(role: Role, body: RubricBody, source: Rubric["source"]): Promise<Rubric> {
    const rubric: Rubric = {
      ...body,
      version: (role.currentRubricVersion ?? 0) + 1,
      createdAt: now().toISOString(),
      source,
    };
    await store.saveRubric(role.id, rubric);
    await store.saveRole({ ...role, currentRubricVersion: rubric.version });
    return rubric;
  }

  async function draftValidRubric(jdText: string): Promise<RubricBody> {
    let lastIssue = "";
    for (let attempt = 0; attempt < MAX_DRAFT_ATTEMPTS; attempt++) {
      let raw: unknown;
      try {
        raw = await gateway.draftRubric(jdText);
      } catch (error) {
        throw new ServiceError(`Couldn't draft a rubric: ${errorMessage(error)}`);
      }
      if (raw === null || raw === undefined) {
        lastIssue = "the model declined to answer";
        continue;
      }
      const parsed = RubricBody.safeParse(raw);
      if (parsed.success) return parsed.data;
      lastIssue = describeIssue(parsed.error);
    }
    throw new ServiceError(
      `The model returned an invalid rubric ${MAX_DRAFT_ATTEMPTS} times (${lastIssue}). Try generating again.`,
    );
  }

  return {
    async createRole(input: { title: string; jd: JdInput }) {
      const title = input.title.trim();
      // Browsers submit form text with CRLF line endings; store it normalised like extracted text.
      const text = normaliseText(input.jd.text);
      if (!title) throw new ServiceError("Give the role a title.");
      if (!text) throw new ServiceError(input.jd.kind === "paste" ? "Paste the job description text." : "The job description has no text.");

      const role = Role.parse({
        id: newId(),
        title,
        createdAt: now().toISOString(),
        jdSource: input.jd.kind,
        currentRubricVersion: null,
      });
      await store.saveJdText(role.id, text);
      await store.saveRole(role);
      return role;
    },

    async listRoles(): Promise<RoleSummary[]> {
      const roles = await store.listRoles();
      const summaries = await Promise.all(
        roles.map(async (role) => ({
          id: role.id,
          title: role.title,
          currentRubricVersion: role.currentRubricVersion,
          runCount: (await store.listRuns(role.id)).length,
          createdAt: role.createdAt,
        })),
      );
      return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getRole(roleId: string) {
      return store.getRole(roleId);
    },

    async getJdText(roleId: string) {
      return store.getJdText(roleId);
    },

    /** Extracts an uploaded document's text so the user can check it before using it. */
    async previewDocument(file: UploadedFile): Promise<DocumentPreview> {
      const extracted = await extractOrExplain(file);
      return { kind: extracted.kind, text: extracted.text, chars: extracted.text.length };
    },

    async generateRubric(roleId: string): Promise<Rubric> {
      const role = await requireRole(roleId);
      const jdText = await store.getJdText(roleId);
      if (!jdText) throw new ServiceError("This role has no job description text.");
      const body = await draftValidRubric(jdText);
      return saveNextRubric(role, body, "generated");
    },

    async scoreResume(roleId: string, file: UploadedFile): Promise<Run> {
      const rubric = await requireCurrentRubric(roleId);
      const extracted = await extractOrExplain(file);
      return decideAndSave(roleId, rubric, { fileName: file.fileName, kind: extracted.kind }, extracted.text);
    },

    /** Scores a past run's stored resume text against the current rubric, as a new run. */
    async rescoreRun(roleId: string, runId: string): Promise<Run> {
      const [run, resumeText] = await Promise.all([store.getRun(roleId, runId), store.getResumeText(roleId, runId)]);
      if (!run || resumeText === null) throw new ServiceError("That run no longer exists.");
      const rubric = await requireCurrentRubric(roleId);
      return decideAndSave(roleId, rubric, run.resume, resumeText);
    },

    /** Runs newest first, each marked stale when scored on an older rubric version. */
    async listRunHistory(roleId: string): Promise<RunHistoryItem[]> {
      const [role, runs] = await Promise.all([store.getRole(roleId), store.listRuns(roleId)]);
      return runs.map((run) => ({ run, stale: isStale(run, role) }));
    },

    async getResumeText(roleId: string, runId: string): Promise<string | null> {
      return store.getResumeText(roleId, runId);
    },

    async getRunView(roleId: string, runId: string, lowConfidenceThreshold: number): Promise<RunView | null> {
      const [run, role] = await Promise.all([store.getRun(roleId, runId), store.getRole(roleId)]);
      if (!run) return null;
      const rubric = await store.getRubric(roleId, run.rubricVersion);
      const resumeText = await store.getResumeText(roleId, runId);
      const decision = runDecision(run);
      const scorecard = rubric && decision ? toScorecard(rubric, decision, lowConfidenceThreshold) : null;
      return { run, rubric, scorecard, resumeText, stale: isStale(run, role) };
    },

    /**
     * Saves an edited rubric as the next version. Earlier versions are never touched.
     * `baseVersion` is the version the editor opened; a save on a stale base is refused.
     */
    async saveRubric(roleId: string, body: unknown, baseVersion: number): Promise<Rubric> {
      const role = await requireRole(roleId);
      if (role.currentRubricVersion !== baseVersion) {
        throw new ServiceError(
          `The rubric changed since you opened it (now v${role.currentRubricVersion}). Reload the editor to edit the latest version.`,
        );
      }
      const parsed = RubricBody.safeParse(body);
      if (!parsed.success) throw new ServiceError(`The rubric isn't valid — ${describeIssue(parsed.error)}`);
      return saveNextRubric(role, parsed.data, "edited");
    },

    async getCurrentRubric(roleId: string): Promise<Rubric | null> {
      const role = await store.getRole(roleId);
      if (!role?.currentRubricVersion) return null;
      return store.getRubric(roleId, role.currentRubricVersion);
    },
  };
}

export type RoleService = ReturnType<typeof createRoleService>;

/** An error whose message is safe to show to the user. */
export class ServiceError extends Error {}

function isStale(run: Run, role: Role | null): boolean {
  return role?.currentRubricVersion != null && run.rubricVersion < role.currentRubricVersion;
}

/** Extracts text, turning any failure into a message safe to show the user. */
async function extractOrExplain(file: UploadedFile) {
  try {
    return await extractText(file);
  } catch (error) {
    if (error instanceof ExtractionError) throw new ServiceError(error.message);
    throw new ServiceError(`Couldn't read "${file.fileName}": ${errorMessage(error)}`);
  }
}

/** First zod issue as "path: message" for user-facing errors. */
function describeIssue(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  const issue = error.issues[0];
  if (!issue) return "schema mismatch";
  return issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}
