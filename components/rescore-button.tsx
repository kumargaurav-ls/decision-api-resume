"use client";

import { useActionState } from "react";
import { rescoreAction, type ActionState } from "@/app/roles/actions";
import { Button } from "@/components/ui/button";

const initialActionState: ActionState = { error: null };

/** Re-scores a run's stored resume text against the current rubric. */
export function RescoreButton({ roleId, runId, label = "Re-score" }: { roleId: string; runId: string; label?: string }) {
  const [state, formAction, pending] = useActionState(rescoreAction.bind(null, roleId, runId), initialActionState);
  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Re-scoring…" : label}
      </Button>
      {state.error && (
        <p role="alert" className="max-w-48 text-xs text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
