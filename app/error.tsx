"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Unexpected errors on any page: say what happened and offer a retry, without a stack trace. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      {/* retry() refetches the server data and re-renders; reset() would only re-render. */}
      <Button className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </main>
  );
}
