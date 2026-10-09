"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireApp } from "@/lib/app";
import { ServiceError } from "@/lib/role-service";

export type FormState = { error: string | null };

export async function createRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
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

export async function generateRubricAction(roleId: string, _prev: FormState): Promise<FormState> {
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
