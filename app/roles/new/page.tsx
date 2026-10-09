import Link from "next/link";
import { NewRoleForm } from "@/components/new-role-form";

export default function NewRolePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ‹ Roles
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New role</h1>
      <NewRoleForm />
    </main>
  );
}
