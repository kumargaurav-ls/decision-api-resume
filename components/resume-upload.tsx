"use client";

import { useActionState, useEffect, useState } from "react";
import {
  previewResumeAction,
  scoreParsedResumeAction,
  type ActionState,
  type PreviewState,
} from "@/app/roles/actions";
import { DOCUMENT_HINT, DocumentFileInput } from "@/components/document-file-input";
import { Button } from "@/components/ui/button";

const initialActionState: ActionState = { error: null };
const initialPreviewState: PreviewState = { error: null, preview: null };

/** Two steps: parse the file and show its text, then score that text with one Decisions call. */
export function ResumeUpload({ roleId, model }: { roleId: string; model: string }) {
  const [previewState, parseAction, parsing] = useActionState(previewResumeAction, initialPreviewState);
  const [scoreState, scoreAction, scoring] = useActionState(scoreParsedResumeAction.bind(null, roleId), initialActionState);
  // Picking a new file hides the old preview until it is parsed.
  const [dismissed, setDismissed] = useState<PreviewState["preview"]>(null);
  const preview = previewState.preview !== dismissed ? previewState.preview : null;
  const elapsedMs = useElapsed(scoring);

  return (
    <div className="space-y-4 rounded-xl border border-dashed px-5 py-6">
      <form action={parseAction}>
        <label htmlFor="resume" className="text-sm font-medium">
          1 · Parse a resume
        </label>
        <p className="mt-1 text-sm text-muted-foreground">{DOCUMENT_HINT} Extracts the text only. No API call.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span onChange={() => setDismissed(previewState.preview)}>
            <DocumentFileInput id="resume" name="resume" />
          </span>
          <Button type="submit" variant={preview ? "outline" : "default"} disabled={parsing || scoring}>
            {parsing ? "Parsing…" : preview ? "Parse another file" : "Parse resume"}
          </Button>
        </div>
        {previewState.error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {previewState.error}
          </p>
        )}
      </form>

      {preview && (
        <form action={scoreAction} className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">
            2 · Check the text, then score it
            <span className="font-normal text-muted-foreground">
              {" "}
              · {preview.fileName} · {preview.chars.toLocaleString()} characters · parsed in {preview.parseMs.toLocaleString()} ms
            </span>
          </p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-sans text-sm">
            {preview.text}
          </pre>
          <input type="hidden" name="fileName" value={preview.fileName} />
          <input type="hidden" name="kind" value={preview.kind} />
          <input type="hidden" name="text" value={preview.text} />
          <input type="hidden" name="parseMs" value={preview.parseMs} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={scoring}>
              {scoring ? `Scoring with ${model}…` : `Score with ${model}`}
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {scoring ? `${(elapsedMs / 1000).toFixed(1)} s` : "One Decisions API call."}
            </span>
          </div>
          {scoreState.error && (
            <p role="alert" className="text-sm text-destructive">
              {scoreState.error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

/** Milliseconds since `running` became true; 0 while idle. */
function useElapsed(running: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const started = performance.now();
    const timer = setInterval(() => setElapsed(performance.now() - started), 100);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [running]);
  return elapsed;
}
