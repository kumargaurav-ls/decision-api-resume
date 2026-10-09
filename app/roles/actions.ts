"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireApp } from "@/lib/app";
import { ServiceError, type DocumentPreview } from "@/lib/role-service";
import { JdSource } from "@/lib/schemas/role";

export type ActionState = { error: string | null };

export async function createRoleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { service } = await requireApp();
  let roleId: string;
  try {
    // For uploads, the text extracted by previewJdAction comes back via hidden inputs.
    // Acceptable for a local single-user tool; the source label is not re-verified.
    const source = JdSource.safeParse(formData.get("jdSource"));
    if (!source.success) return { error: "Unknown job description source." };
    const role = await service.createRole({
      title: String(formData.get("title") ?? ""),
      jd: { kind: source.data, text: String(formData.get("jdText") ?? "") },
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

export type PreviewState = { error: string | null; preview: (DocumentPreview & { fileName: string }) | null };

/** Extracts an uploaded JD so the user can check the text before creating the role. */
export async function previewJdAction(_prev: PreviewState, formData: FormData): Promise<PreviewState> {
  const { service } = await requireApp();
  const file = formData.get("jdFile");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF or DOCX job description.", preview: null };
  try {
    const preview = await service.previewDocument({ fileName: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    return { error: null, preview: { ...preview, fileName: file.name } };
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message, preview: null };
    throw error;
  }
}

export async function rescoreAction(roleId: string, runId: string, _prev: ActionState): Promise<ActionState> {
  const { service } = await requireApp();
  let newRunId: string;
  try {
    newRunId = (await service.rescoreRun(roleId, runId)).id;
  } catch (error) {
    if (error instanceof ServiceError) return { error: error.message };
    throw error;
  }
  redirect(`/roles/${roleId}/runs/${newRunId}`);
}
