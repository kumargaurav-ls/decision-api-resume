"use client";

import { useActionState, useState } from "react";
import {
  createRoleAction,
  previewJdAction,
  type ActionState,
  type PreviewState,
} from "@/app/roles/actions";
import { DOCUMENT_HINT, DocumentFileInput } from "@/components/document-file-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialActionState: ActionState = { error: null };
const initialPreviewState: PreviewState = { error: null, preview: null };

export function NewRoleForm() {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [pasted, setPasted] = useState("");
  const [state, createAction, creating] = useActionState(createRoleAction, initialActionState);
  const [previewState, previewAction, extracting] = useActionState(previewJdAction, initialPreviewState);
  const preview = mode === "upload" ? previewState.preview : null;

  return (
    <div className="mt-8 space-y-6">
      <div role="group" aria-label="Job description source" className="inline-flex rounded-lg border p-0.5">
        {(["paste", "upload"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={mode === option}
            onClick={() => setMode(option)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors aria-pressed:bg-muted aria-pressed:text-foreground"
          >
            {option === "paste" ? "Paste text" : "Upload PDF / DOCX"}
          </button>
        ))}
      </div>

      {mode === "upload" && (
        <form action={previewAction} className="space-y-3 rounded-xl border border-dashed px-5 py-5">
          <Label htmlFor="jdFile">Job description file</Label>
          <p className="text-sm text-muted-foreground">{DOCUMENT_HINT} We extract the text for you to check.</p>
          <div className="flex flex-wrap items-center gap-3">
            <DocumentFileInput id="jdFile" name="jdFile" />
            <Button type="submit" variant="outline" disabled={extracting}>
              {extracting ? "Extracting…" : "Extract text"}
            </Button>
          </div>
          {previewState.error && (
            <p role="alert" className="text-sm text-destructive">
              {previewState.error}
            </p>
          )}
        </form>
      )}

      <form action={createAction} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" placeholder="Senior Applied AI Engineer" required />
        </div>

        {mode === "paste" ? (
          <div className="space-y-2">
            <Label htmlFor="jdText">Job description</Label>
            <Textarea
              id="jdText"
              name="jdText"
              rows={14}
              placeholder="Paste the job description text…"
              required
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{pasted.trim().length.toLocaleString()} characters</p>
            <input type="hidden" name="jdSource" value="paste" />
          </div>
        ) : preview ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Extracted text <span className="font-normal text-muted-foreground">· {preview.fileName} · {preview.chars.toLocaleString()} characters</span>
            </p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-sans text-sm">
              {preview.text}
            </pre>
            <input type="hidden" name="jdText" value={preview.text} />
            <input type="hidden" name="jdSource" value={preview.kind} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Extract a file above to see its text here.</p>
        )}

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={creating || (mode === "upload" && !preview)}>
          {creating ? "Saving…" : "Create role"}
        </Button>
      </form>
    </div>
  );
}
