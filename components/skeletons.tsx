import { cn } from "@/lib/utils";

/** Placeholder blocks shaped like the content they stand in for. Pulse only when motion is allowed. */
function Block({ className }: { className: string }) {
  return <div className={cn("rounded-xl bg-muted motion-safe:animate-pulse", className)} />;
}

function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function RolesListSkeleton() {
  return (
    <Loading label="Loading roles">
      <div className="mt-8 space-y-px overflow-hidden rounded-xl border">
        {[0, 1, 2].map((i) => (
          <Block key={i} className="h-14 rounded-none" />
        ))}
      </div>
    </Loading>
  );
}

export function RoleSkeleton() {
  return (
    <Loading label="Loading role">
      <Block className="mt-4 h-8 w-72" />
      <Block className="mt-8 h-32" />
      <Block className="mt-6 h-24" />
      <Block className="mt-10 h-64" />
    </Loading>
  );
}

export function RubricEditorSkeleton() {
  return (
    <Loading label="Loading rubric">
      <Block className="h-8 w-48" />
      <Block className="mt-6 h-12" />
      <Block className="mt-6 h-24" />
      <Block className="mt-6 h-72" />
    </Loading>
  );
}

export function RunSkeleton() {
  return (
    <Loading label="Loading run">
      <Block className="h-8 w-64" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-6">
          <Block className="h-48" />
          <Block className="h-96" />
        </div>
        <Block className="h-[28rem]" />
      </div>
    </Loading>
  );
}
