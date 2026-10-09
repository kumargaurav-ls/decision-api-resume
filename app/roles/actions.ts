"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireApp } from "@/lib/app";
import { ServiceError } from "@/lib/role-service";

export type ActionState = { error: string | null };

export async function createRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { service } = await requireApp();
  let roleId: string;
  try {
    const role = await service.createRole({
      title: String(formData.get("title") ?? ""),
      jd: { kind: "paste", text: String(formData.get("jdText") ?? "") },
    });
    roleId = role.id;
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    throw error;
  }
  redirect(`/roles/${roleId}`);
}

export async function generateRubricAction(roleId: string, _prev: ActionState): Promise<ActionState> {
  const { service } = await requireApp();
  try {
    await service.generateRubric(roleId);
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    throw error;
  }
  refresh();
  return { error: null };
}

export async function scoreResumeAction(roleId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const { service } = await requireApp();
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF or DOCX resume first." };

  let runId: string;
  try {
    const run = await service.scoreResume(roleId, { fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    runId = run.id;
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    throw error;
  }
  redirect(`/roles/${roleId}/runs/${runId}`);
}

/** Called directly from the rubric editor (not a form), so it takes the rubric object. */
export async function saveRubricAction(roleId: string, rubric: unknown, baseVersion: number): Promise<ActionState> {
  const { service } = await requireApp();
  try {
    await service.saveRubric(roleId, rubric, baseVersion);
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    throw error;
  }
  redirect(`/roles/${roleId}`);
}
