import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { RubricEditor } from "@/components/rubric-editor";
import { RubricEditorSkeleton } from "@/components/skeletons";
import { getApp } from "@/lib/app";

export default function RubricEditorPage({ params }: PageProps<"/roles/[id]/rubric">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Suspense fallback={<RubricEditorSkeleton />}>
        <Editor params={params} />
      </Suspense>
    </main>
  );
}

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getApp();
  if (!app) return null;
  const [role, rubric] = await Promise.all([app.service.getRole(id), app.service.getCurrentRubric(id)]);
  if (!role) notFound();
  if (!rubric) redirect(`/roles/${id}`);

  return (
    <>
      <Link href={`/roles/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
        ‹ {role.title}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit rubric</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Each part becomes a Decisions API question. Level labels are fixed; describe what each level looks like for this role.
      </p>
      <div className="mt-6">
        <RubricEditor roleId={id} rubric={rubric} />
      </div>
    </>
  );
}
