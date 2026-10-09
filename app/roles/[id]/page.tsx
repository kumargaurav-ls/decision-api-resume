import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
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
  const jdText = await app.service.getJdText(id);

  return (
    <>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{role.title}</h1>
      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Job description</h2>
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-sans text-sm">
          {jdText}
        </pre>
      </section>
    </>
  );
}
