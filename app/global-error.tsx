"use client";

/** Errors in the root layout itself. Renders its own document, so it carries minimal inline styles. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "96px auto", padding: "0 16px", lineHeight: 1.5 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Something went wrong</h1>
        <p>The app could not load. Check the terminal running pnpm dev for details.</p>
        {error.digest && <p style={{ fontFamily: "monospace", fontSize: 12 }}>ref {error.digest}</p>}
        <button onClick={() => retry()} style={{ marginTop: 16, padding: "8px 14px", borderRadius: 8 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
