import type { Rubric, Statement } from "@/lib/schemas/rubric";

/** Read-only rubric, grouped by the Decisions question type each part becomes. */
export function RubricView({ rubric }: { rubric: Rubric }) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Rubric v{rubric.version} · {rubric.source} · {new Date(rubric.createdAt).toLocaleString()}
      </p>
      <section>
        <SectionTitle title="Role summary" hint="context for the fit question" />
        <p className="mt-2 text-sm">{rubric.roleSummary}</p>
      </section>
      <section>
        <SectionTitle title="Dimensions" hint="score questions" />
        <div className="mt-3 space-y-3">
          {rubric.dimensions.map((dimension) => (
            <details key={dimension.key} className="rounded-lg border px-4 py-3">
              <summary className="cursor-pointer font-medium">{dimension.name}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{dimension.instructions}</p>
              <dl className="mt-3 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1.5 text-sm">
                {dimension.levels.map((level) => (
                  <div key={level.label} className="contents">
                    <dt className="font-medium">{level.label}</dt>
                    <dd className="text-muted-foreground">{level.description}</dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      </section>
      <StatementList title="Must-haves" hint="predicate questions" items={rubric.mustHaves} />
      <StatementList title="Red flags" hint="predicate questions" items={rubric.redFlags} />
      <section>
        <SectionTitle title="Overall fit" hint="choice question" />
        <p className="mt-2 text-sm text-muted-foreground">{rubric.fit.instructions}</p>
        <dl className="mt-3 space-y-1.5 text-sm">
          {rubric.fit.options.map((option) => (
            <div key={option.value} className="flex gap-3">
              <dt className="w-28 shrink-0 font-mono text-xs leading-5">{option.value}</dt>
              <dd className="text-muted-foreground">{option.description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <h3 className="flex items-baseline gap-2 text-sm font-semibold">
      {title}
      <span className="font-mono text-xs font-normal text-muted-foreground">→ {hint}</span>
    </h3>
  );
}

function StatementList({ title, hint, items }: { title: string; hint: string; items: Statement[] }) {
  return (
    <section>
      <SectionTitle title={title} hint={hint} />
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {items.map((item) => (
            <li key={item.key}>{item.statement}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
