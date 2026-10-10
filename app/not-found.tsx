import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-muted-foreground">That role or run doesn&apos;t exist, or it was removed from the data folder.</p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Back to roles
      </Link>
    </main>
  );
}
