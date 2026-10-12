"use server";

import { requireApp } from "@/lib/app";
import { LabError, type LabResult } from "@/lib/lab";

export type LabState = { ok: true; result: LabResult } | { ok: false; error: string };

/** One Decisions call for the lab's switched-on lines. Called directly from the page, not a form. */
export async function labDecideAction(lineIds: string[]): Promise<LabState> {
  const { lab } = await requireApp();
  try {
    return { ok: true, result: await lab.decide(lineIds) };
  } catch (error) {
    if (error instanceof LabError) return { ok: false, error: error.message };
    return { ok: false, error: `The Decisions API call failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}
