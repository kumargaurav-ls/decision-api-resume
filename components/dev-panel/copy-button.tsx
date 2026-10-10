"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const FEEDBACK_MS = 1600;

/** Copies text to the clipboard and confirms for a moment. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimer(timer), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimer(timer);
    timer.current = setTimeout(() => setState("idle"), FEEDBACK_MS);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={copy}>
        {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
      </Button>
      <span role="status" className="sr-only">
        {state === "copied" ? `${label}: copied to clipboard` : state === "failed" ? `${label}: copy failed` : ""}
      </span>
    </>
  );
}

function clearTimer(timer: React.RefObject<ReturnType<typeof setTimeout> | null>) {
  if (timer.current) clearTimeout(timer.current);
  timer.current = null;
}
