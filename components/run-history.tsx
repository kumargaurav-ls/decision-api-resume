import Link from "next/link";
import { fitSummary } from "@/lib/decisions/scorecard";
import type { Run } from "@/lib/schemas/run";

export function RunHistory({ roleId, runs }: { roleId: string; runs: Run[] }) {
  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">No resumes scored yet.</p>;
  }
  return (
    <ul className="divide-y rounded-xl border">
      {runs.map((run) => {
        const fit = fitSummary(run);
        return (
          <li key={run.id}>
            <Link
              href={`/roles/${roleId}/runs/${run.id}`}
              className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0 truncate font-medium">{run.resume.fileName}</span>
              <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                {run.error ? (
                  <span className="text-destructive">failed</span>
                ) : fit ? (
                  <span className="font-mono text-xs text-foreground">
                    {fit.choice} {fit.confidence.toFixed(2)}
                  </span>
                ) : (
                  <span>no fit answer</span>
                )}
                <span>v{run.rubricVersion}</span>
                <time dateTime={run.createdAt}>{new Date(run.createdAt).toLocaleString()}</time>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
