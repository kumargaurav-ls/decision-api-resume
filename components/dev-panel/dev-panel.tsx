import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "./copy-button";

export type DevPanelProps = {
  /** Pretty-printed JSON, prepared on the server. */
  requestJson: string;
  responseJson: string | null;
  latencyMs: number;
  costUsd: number;
  usage: { input: number; output: number; total: number } | null;
  resumeText: string | null;
  curl: string;
  typescript: string;
};

/** What happened on the wire for one Decisions call. Server component; only tabs and copy are client-side. */
export function DevPanel({ requestJson, responseJson, latencyMs, costUsd, usage, resumeText, curl, typescript }: DevPanelProps) {
  return (
    <section aria-labelledby="dev-panel-heading" className="rounded-2xl border bg-card p-5">
      <h2 id="dev-panel-heading" className="text-sm font-medium text-muted-foreground">
        Dev panel <span className="font-mono text-xs">· POST /v1/decisions</span>
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        <Stat label="Latency" value={`${latencyMs.toLocaleString()} ms`} />
        <Stat label="Cost" value={`$${costUsd.toFixed(6)}`} />
        <Stat label="Input tokens" value={usage ? usage.input.toLocaleString() : "n/a"} />
        <Stat label="Output tokens" value={usage ? usage.output.toLocaleString() : "n/a"} />
        <Stat label="Total tokens" value={usage ? usage.total.toLocaleString() : "n/a"} />
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton text={curl} label="Copy as curl" />
        <CopyButton text={typescript} label="Copy as TypeScript" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Snippets read your key from OPENAI_API_KEY; it is never included.</p>

      <Tabs defaultValue="request" className="mt-5">
        <TabsList>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="resume">Resume text</TabsTrigger>
        </TabsList>
        <TabsContent value="request">
          <Code label="Request JSON" text={requestJson} />
        </TabsContent>
        <TabsContent value="response">
          {responseJson ? <Code label="Response JSON" text={responseJson} /> : <Empty text="No response: the call failed." />}
        </TabsContent>
        <TabsContent value="resume">
          {resumeText ? <Code label="Extracted resume text" text={resumeText} wrap /> : <Empty text="The extracted text is missing on disk." />}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}

function Code({ label, text, wrap = false }: { label: string; text: string; wrap?: boolean }) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className={`max-h-[32rem] overflow-auto rounded-xl bg-muted p-4 font-mono text-xs leading-relaxed ${wrap ? "whitespace-pre-wrap" : ""}`}
    >
      {text}
    </pre>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{text}</p>;
}
