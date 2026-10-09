import { randomUUID } from "node:crypto";
import type { OpenAIGateway } from "./gateway";
import { Role } from "./schemas/role";
import { RubricBody, type Rubric } from "./schemas/rubric";
import type { Run } from "./schemas/run";
import { buildDecisionRequest } from "./decisions/build-questions";
import { costUsd } from "./decisions/cost";
import { runDecision, toScorecard, type Scorecard } from "./decisions/scorecard";
import { ExtractionError, extractText, type UploadedFile } from "./extract";
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

export type JdInput = { kind: "paste"; text: string };

/** A run with the rubric it was scored on (null if that file is gone) and its parsed scorecard. */
export type RunView = { run: Run; rubric: Rubric | null; scorecard: Scorecard | null; resumeText: string | null };

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
      lastIssue = parsed.error.issues[0]?.message ?? "schema mismatch";
    }
    throw new ServiceError(
      `The model returned an invalid rubric ${MAX_DRAFT_ATTEMPTS} times (${lastIssue}). Try generating again.`,
    );
  }

  return {
    async createRole(input: { title: string; jd: JdInput }) {
      const title = input.title.trim();
      const text = input.jd.text.trim();
      if (!title) throw new ServiceError("Give the role a title.");
      if (!text) throw new ServiceError("Paste the job description text.");

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

    async generateRubric(roleId: string): Promise<Rubric> {
      const role = await requireRole(roleId);
      const jdText = await store.getJdText(roleId);
      if (!jdText) throw new ServiceError("This role has no job description text.");
      const body = await draftValidRubric(jdText);
      return saveNextRubric(role, body, "generated");
    },

    async scoreResume(roleId: string, file: UploadedFile): Promise<Run> {
      const role = await requireRole(roleId);
      if (!role.currentRubricVersion) throw new ServiceError("Generate a rubric first.");
      const rubric = await store.getRubric(roleId, role.currentRubricVersion);
      if (!rubric) throw new ServiceError("This role's current rubric is missing on disk.");

      let extracted;
      try {
        extracted = await extractText(file);
      } catch (error) {
        if (error instanceof ExtractionError) throw new ServiceError(error.message);
        throw new ServiceError(`Couldn't read "${file.fileName}": ${errorMessage(error)}`);
      }

      const request = buildDecisionRequest(rubric, extracted.text, decisionModel);
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
        resume: { fileName: file.fileName, kind: extracted.kind, chars: extracted.text.length },
        request,
        response,
        latencyMs,
        costUsd: response ? costUsd(response.usage) : 0,
        error,
      };
      await store.saveRun(run, extracted.text);
      return run;
    },

    async listRuns(roleId: string): Promise<Run[]> {
      return store.listRuns(roleId);
    },

    async getResumeText(roleId: string, runId: string): Promise<string | null> {
      return store.getResumeText(roleId, runId);
    },

    async getRunView(roleId: string, runId: string, lowConfidenceThreshold: number): Promise<RunView | null> {
      const run = await store.getRun(roleId, runId);
      if (!run) return null;
      const rubric = await store.getRubric(roleId, run.rubricVersion);
      const resumeText = await store.getResumeText(roleId, runId);
      const decision = runDecision(run);
      const scorecard = rubric && decision ? toScorecard(rubric, decision, lowConfidenceThreshold) : null;
      return { run, rubric, scorecard, resumeText };
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}
