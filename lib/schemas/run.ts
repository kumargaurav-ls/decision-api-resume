import { z } from "zod";

export const Run = z.object({
  id: z.string(),
  roleId: z.string(),
  rubricVersion: z.number().int().positive(),
  createdAt: z.string(),
  resume: z.object({
    fileName: z.string(),
    /** "text" = plain text scored directly (the eval harness). */
    kind: z.enum(["pdf", "docx", "text"]),
    chars: z.number().int().nonnegative(),
  }),
  /** Exact body sent to the Decisions API — powers the dev panel. */
  request: z.unknown(),
  /** Raw Decision object; null when the call failed. */
  response: z.unknown().nullable(),
  latencyMs: z.number().nonnegative(),
  costUsd: z.number().nonnegative(),
  error: z.string().nullable(),
});

export type Run = z.infer<typeof Run>;
