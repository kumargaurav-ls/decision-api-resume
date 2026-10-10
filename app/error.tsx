"use client";

import { Button } from "@/components/ui/button";

/** Unexpected errors on any page: say what happened and offer a retry, without a stack trace. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        The page hit an unexpected error. Your roles and runs on disk are untouched.
      </p>
      <p className="mt-4 rounded-xl bg-muted px-4 py-3 font-mono text-xs text-muted-foreground">
        {error.message || "Unknown error"}
        {error.digest ? ` (ref ${error.digest})` : ""}
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
