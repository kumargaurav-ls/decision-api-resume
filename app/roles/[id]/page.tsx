import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { GenerateRubricButton } from "@/components/generate-rubric-button";
import { ResumeUpload } from "@/components/resume-upload";
import { RunHistory } from "@/components/run-history";
import { RubricView } from "@/components/rubric-view";
import { getApp } from "@/lib/app";

export default function RolePage({ params }: PageProps<"/roles/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ‹ Roles
      </Link>
      <Suspense fallback={<p className="mt-6 text-sm text-muted-foreground">Loading role…</p>}>
        <RoleDetail params={params} />
      </Suspense>
    </main>
  );
}

async function RoleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApp();
  if (!app) return null;
  const role = await app.service.getRole(id);
  if (!role) notFound();
  const [jdText, rubric, runs] = await Promise.all([
    app.service.getJdText(id),
    app.service.getCurrentRubric(id),
    app.service.listRuns(id),
  ]);

  return (
    <>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{role.title}</h1>
      {rubric && (
        <section className="mt-8 space-y-6">
          <ResumeUpload roleId={role.id} model={app.config.decisionModel} />
          <div>
            <h2 className="text-sm font-semibold">History</h2>
            <div className="mt-3">
              <RunHistory roleId={role.id} runs={runs} />
            </div>
          </div>
        </section>
      )}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Rubric</h2>
          {rubric && (
            <div className="flex flex-wrap items-start gap-2">
              <Link href={`/roles/${role.id}/rubric`} className={buttonVariants({ variant: "outline" })}>
                Edit rubric
              </Link>
              <GenerateRubricButton roleId={role.id} model={app.config.rubricModel} regenerate />
            </div>
          )}
        </div>
        <div className="mt-4">
          {rubric ? (
            <RubricView rubric={rubric} />
          ) : (
            <div className="rounded-xl border border-dashed px-6 py-10">
              <p className="mb-4 text-sm text-muted-foreground">
                No rubric yet. Draft one from the job description — you can edit it afterwards.
              </p>
              <GenerateRubricButton roleId={role.id} model={app.config.rubricModel} />
            </div>
          )}
        </div>
      </section>
      <details className="mt-10">
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground">Job description</summary>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-sans text-sm">
          {jdText}
        </pre>
      </details>
    </>
  );
}
