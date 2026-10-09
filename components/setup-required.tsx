import type { ConfigProblems } from "@/lib/app";

export function SetupRequired({ missing, invalid }: Pick<ConfigProblems, "missing" | "invalid">) {
  return (
    <section className="border-b bg-muted/40">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <h2 className="text-xl font-semibold tracking-tight">One step before you start</h2>
        <p className="mt-2 text-muted-foreground">
          The playground calls OpenAI from the server. Add your settings to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">.env.local</code> in the project root, then
          restart <code className="rounded bg-muted px-1.5 py-0.5 text-sm">pnpm dev</code>.
        </p>
        <EnvList title="Missing" names={missing} />
        <EnvList title="Invalid" names={invalid} />
        <pre className="mt-6 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          {`cp .env.example .env.local\n# then set OPENAI_API_KEY=sk-...\n# or set OPENAI_MOCK=1 to try the UI with canned responses`}
        </pre>
      </div>
    </section>
  );
}

function EnvList({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-1 space-y-1 font-mono text-sm">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
