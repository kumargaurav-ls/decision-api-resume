"use client";

import { useActionState } from "react";
import { createRoleAction, type FormState } from "@/app/roles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialFormState: FormState = { error: null };

export function NewRoleForm() {
  const [state, formAction, pending] = useActionState(createRoleAction, initialFormState);
  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Senior Applied AI Engineer" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jdText">Job description</Label>
        <Textarea
          id="jdText"
          name="jdText"
          rows={14}
          placeholder="Paste the job description text…"
          required
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create role"}
      </Button>
    </form>
  );
}
