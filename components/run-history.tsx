import Link from "next/link";
import { fitSummary } from "@/lib/decisions/scorecard";
import type { RunHistoryItem } from "@/lib/role-service";
import { RescoreButton } from "./rescore-button";
import { StaleBadge } from "./stale-badge";

export function RunHistory({ roleId, history }: { roleId: string; history: RunHistoryItem[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No resumes scored yet.</p>;
  }
  return (
    <ul className="divide-y rounded-xl border">
      {history.map(({ run, stale }) => {
        const fit = fitSummary(run);
        return (
          <li key={run.id} className="flex items-start gap-3 px-2 py-1.5 text-sm">
            <Link
              href={`/roles/${roleId}/runs/${run.id}`}
              className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-lg px-3 py-1.5 transition-colors hover:bg-muted/50"
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
                {stale ? <StaleBadge version={run.rubricVersion} /> : <span>v{run.rubricVersion}</span>}
                <time dateTime={run.createdAt}>{new Date(run.createdAt).toLocaleString()}</time>
              </span>
            </Link>
            {stale && (
              <div className="py-0.5">
                <RescoreButton roleId={roleId} runId={run.id} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
