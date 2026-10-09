import { randomUUID } from "node:crypto";
import type { OpenAIGateway } from "./gateway";
import { Role } from "./schemas/role";
import type { Store } from "./store";

export type RoleSummary = {
  id: string;
  title: string;
  currentRubricVersion: number | null;
  runCount: number;
  createdAt: string;
};

export type JdInput = { kind: "paste"; text: string };

type RoleServiceDeps = {
  store: Store;
  gateway: OpenAIGateway;
  now?: () => Date;
  newId?: () => string;
};

export function createRoleService({ store, now = () => new Date(), newId = shortId }: RoleServiceDeps) {
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
  };
}

export type RoleService = ReturnType<typeof createRoleService>;

/** An error whose message is safe to show to the user. */
export class ServiceError extends Error {}

function shortId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}
