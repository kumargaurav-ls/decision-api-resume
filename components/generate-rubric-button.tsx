"use client";

import { useActionState } from "react";
import { generateRubricAction, type ActionState } from "@/app/roles/actions";
import { Button } from "@/components/ui/button";

const initialActionState: ActionState = { error: null };

export function GenerateRubricButton({
  roleId,
  model,
  regenerate = false,
}: {
  roleId: string;
  model: string;
  regenerate?: boolean;
}) {
  const [state, formAction, pending] = useActionState(generateRubricAction.bind(null, roleId), initialActionState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button type="submit" variant={regenerate ? "outline" : "default"} disabled={pending}>
        {pending ? "Drafting rubric…" : regenerate ? "Regenerate rubric" : `Generate rubric with ${model}`}
      </Button>
      {pending && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Asking {model} for a structured rubric. This usually takes under 30 seconds.
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}
