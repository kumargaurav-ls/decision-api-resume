import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="mt-3 text-muted-foreground">There&apos;s nothing at this address. If you followed a link to a role or run, it may have been removed from the data folder.</p>
      <Link href="/" className={buttonVariants({ className: "mt-6" })}>
        Back to roles
      </Link>
    </main>
  );
}
