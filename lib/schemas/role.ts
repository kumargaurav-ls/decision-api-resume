import { z } from "zod";

export const JdSource = z.enum(["paste", "pdf", "docx"]);

export const Role = z.object({
  id: z.string(),
  title: z.string().trim().min(1),
  createdAt: z.string(),
  jdSource: JdSource,
  currentRubricVersion: z.number().int().positive().nullable(),
});

export type Role = z.infer<typeof Role>;
export type JdSource = z.infer<typeof JdSource>;

export function jdSourceLabel(source: JdSource): string {
  return source === "paste" ? "pasted" : source.toUpperCase();
}
