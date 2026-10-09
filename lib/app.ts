import "server-only";
import { connection } from "next/server";
import { cache } from "react";
import { loadConfig, type Config, type ConfigResult } from "./config";
import { createMockGateway } from "./gateway-mock";
import { createOpenAIGateway } from "./gateway-openai";
import { createRoleService, type RoleService } from "./role-service";
import { createStore } from "./store";

export type App = { config: Config; service: RoleService };
export type ConfigProblems = Extract<ConfigResult, { ok: false }>;

/** Loads env and builds services once per request. */
export const loadApp = cache(async (): Promise<{ app: App } | { problems: ConfigProblems }> => {
  await connection();
  const result = loadConfig();
  if (!result.ok) return { problems: result };
  const { config } = result;
  const gateway = config.mockMode
    ? createMockGateway()
    : createOpenAIGateway({ apiKey: config.openaiApiKey!, rubricModel: config.rubricModel });
  const service = createRoleService({ store: createStore(config.dataDir), gateway, decisionModel: config.decisionModel });
  return { app: { config, service } };
});

/** The configured app, or null when env is incomplete (the layout shows the setup panel). */
export async function getApp(): Promise<App | null> {
  const loaded = await loadApp();
  return "app" in loaded ? loaded.app : null;
}

/** For Server Actions: throws when env is incomplete. */
export async function requireApp(): Promise<App> {
  const loaded = await loadApp();
  if ("app" in loaded) return loaded.app;
  const names = [...loaded.problems.missing, ...loaded.problems.invalid].join(", ");
  throw new Error(`App is not configured — check ${names} in .env.local`);
}
