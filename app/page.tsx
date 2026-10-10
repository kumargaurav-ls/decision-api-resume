import Link from "next/link";
import { Suspense } from "react";
import { RolesListSkeleton } from "@/components/skeletons";
import { buttonVariants } from "@/components/ui/button";
import { getApp } from "@/lib/app";

export default function RolesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Decision Playground</h1>
        <Link href="/roles/new" className={buttonVariants()}>
          New role
        </Link>
      </header>
      <Suspense fallback={<RolesListSkeleton />}>
        <RolesList />
      </Suspense>
    </main>
  );
}

async function RolesList() {
  const app = await getApp();
  if (!app) return null;
  const roles = await app.service.listRoles();

  if (roles.length === 0) {
    return (
      <section className="mt-16 rounded-xl border border-dashed px-6 py-14 text-center">
        <h2 className="text-lg font-medium">Start with a job description</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Paste a JD, let the model draft a rubric, then score a resume against it with the Decisions API.
        </p>
        <Link href="/roles/new" className={buttonVariants({ className: "mt-6" })}>
          New role
        </Link>
      </section>
    );
  }

  return (
    <ul className="mt-8 divide-y rounded-xl border">
      {roles.map((role) => (
        <li key={role.id}>
          <Link
            href={`/roles/${role.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
          >
            <span className="font-medium">{role.title}</span>
            <span className="shrink-0 text-sm text-muted-foreground">
              {role.currentRubricVersion === null ? "no rubric" : `rubric v${role.currentRubricVersion}`} ·{" "}
              {role.runCount} {role.runCount === 1 ? "run" : "runs"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
