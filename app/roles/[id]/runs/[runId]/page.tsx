import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Scorecard } from "@/components/scorecard/scorecard";
import { RescoreButton } from "@/components/rescore-button";
import { StaleBadge } from "@/components/stale-badge";
import { getApp } from "@/lib/app";

export default function RunPage({ params }: PageProps<"/roles/[id]/runs/[runId]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading run…</p>}>
        <RunDetail params={params} />
      </Suspense>
    </main>
  );
}

async function RunDetail({ params }: { params: Promise<{ id: string; runId: string }> }) {
  const { id, runId } = await params;
  const app = await getApp();
  if (!app) return null;
  const [role, view] = await Promise.all([
    app.service.getRole(id),
    app.service.getRunView(id, runId, app.config.lowConfidenceThreshold),
  ]);
  if (!role || !view) notFound();
  const { run, scorecard, stale } = view;

  return (
    <>
      <Link href={`/roles/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ‹ {role.title}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{run.resume.fileName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rubric v{run.rubricVersion} · {run.latencyMs} ms · ${run.costUsd.toFixed(6)}
      </p>
      {stale && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-caution-soft px-4 py-3 text-sm text-caution">
          <span className="flex items-center gap-2">
            <StaleBadge version={run.rubricVersion} />
            The role is now on v{role.currentRubricVersion}.
          </span>
          <RescoreButton roleId={id} runId={run.id} label={`Re-score on v${role.currentRubricVersion}`} />
        </div>
      )}
      {run.error ? (
        <div role="alert" className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-5 text-sm">
          <p className="font-medium text-destructive">The Decisions API call failed.</p>
          <p className="mt-1 font-mono text-xs">{run.error}</p>
        </div>
      ) : scorecard ? (
        <div className="mt-8">
          <Scorecard scorecard={scorecard} threshold={app.config.lowConfidenceThreshold} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          Rubric v{run.rubricVersion} is missing on disk, so this run can&apos;t be shown as a scorecard.
        </p>
      )}
    </>
  );
}
