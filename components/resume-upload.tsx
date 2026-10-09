"use client";

import { useActionState } from "react";
import { scoreResumeAction, type ActionState } from "@/app/roles/actions";
import { Button } from "@/components/ui/button";

const initialActionState: ActionState = { error: null };

export function ResumeUpload({ roleId, model }: { roleId: string; model: string }) {
  const [state, formAction, pending] = useActionState(scoreResumeAction.bind(null, roleId), initialActionState);
  return (
    <form action={formAction} className="rounded-xl border border-dashed px-5 py-6">
      <label htmlFor="resume" className="text-sm font-medium">
        Score a resume
      </label>
      <p className="mt-1 text-sm text-muted-foreground">Text-based PDF or DOCX, up to 5 MB. One Decisions API call.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
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
