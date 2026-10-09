"use client";

import { useActionState } from "react";
import { scoreResumeAction, type ActionState } from "@/app/roles/actions";
import { DOCUMENT_HINT, DocumentFileInput } from "@/components/document-file-input";
import { Button } from "@/components/ui/button";

const initialActionState: ActionState = { error: null };

export function ResumeUpload({ roleId, model }: { roleId: string; model: string }) {
  const [state, formAction, pending] = useActionState(scoreResumeAction.bind(null, roleId), initialActionState);
  return (
    <form action={formAction} className="rounded-xl border border-dashed px-5 py-6">
      <label htmlFor="resume" className="text-sm font-medium">
        Score a resume
      </label>
      <p className="mt-1 text-sm text-muted-foreground">{DOCUMENT_HINT} One Decisions API call.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DocumentFileInput id="resume" name="resume" />
        <Button type="submit" disabled={pending}>
          {pending ? `Scoring with ${model}…` : "Score resume"}
        </Button>
      </div>
      {state.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
