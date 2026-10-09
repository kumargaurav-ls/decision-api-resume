"use client";

import { useId, useMemo, useRef, useState, useTransition } from "react";
import { saveRubricAction } from "@/app/roles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LEVEL_LABELS, RUBRIC_LIMITS, RubricBody, type Rubric, type Statement } from "@/lib/schemas/rubric";

type Issues = Map<string, string>;
type ListName = "dimensions" | "mustHaves" | "redFlags";
/** Rubric plus stable client-side row ids, so focus and DOM identity follow a row when it moves. */
type EditorState = { rubric: RubricBody; rowIds: Record<ListName, string[]> };

const STATEMENT_GROUPS = {
  mustHaves: { title: "Must-haves", singular: "Must-have", max: RUBRIC_LIMITS.maxMustHaves },
  redFlags: { title: "Red flags", singular: "Red flag", max: RUBRIC_LIMITS.maxRedFlags },
} as const;

/** Words that carry no meaning in a statement key ("The candidate has …"). */
const KEY_STOP_WORDS = new Set([
  "the", "a", "an", "has", "have", "is", "are", "of", "for", "to", "in", "on", "at", "with",
  "candidate", "resume", "least", "one",
]);

let nextRowId = 0;
const newRowId = () => `row-${nextRowId++}`;

/** Form editor for a rubric. Validates against the same schema the server enforces. */
export function RubricEditor({ roleId, rubric: saved }: { roleId: string; rubric: Rubric }) {
  const { version, createdAt: _createdAt, source: _source, ...initial } = saved;
  const [state, setState] = useState<EditorState>(() => ({
    rubric: initial,
    rowIds: {
      dimensions: initial.dimensions.map(newRowId),
      mustHaves: initial.mustHaves.map(newRowId),
      redFlags: initial.redFlags.map(newRowId),
    },
  }));
  const { rubric, rowIds } = state;
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const alertRef = useRef<HTMLParagraphElement>(null);
  const savedKeys = useMemo(
    () => ({
      dimensions: new Set(initial.dimensions.map((item) => item.key)),
      mustHaves: new Set(initial.mustHaves.map((item) => item.key)),
      redFlags: new Set(initial.redFlags.map((item) => item.key)),
    }),
    [initial.dimensions, initial.mustHaves, initial.redFlags],
  );

  const issues = useMemo(() => validate(rubric), [rubric]);
  const dirty = JSON.stringify(rubric) !== JSON.stringify(initial);

  const update = (change: (draft: EditorState) => void) => {
    setState((current) => {
      const draft = structuredClone(current);
      change(draft);
      return draft;
    });
  };

  /** New rows get keys derived from their text; saved rows keep theirs (past runs reference them). */
  const rekeyIfNew = (list: ListName, items: { key: string }[], index: number, base: string) => {
    if (!savedKeys[list].has(items[index].key)) items[index].key = uniqueKey(base, items, index);
  };

  const addRow = (list: ListName, row: RubricBody[ListName][number]) =>
    update((d) => {
      (d.rubric[list] as (typeof row)[]).push(row);
      d.rowIds[list].push(newRowId());
    });
  const removeRow = (list: ListName, index: number) =>
    update((d) => {
      d.rubric[list].splice(index, 1);
      d.rowIds[list].splice(index, 1);
    });
  const moveRow = (list: ListName, from: number, to: number) =>
    update((d) => {
      swap(d.rubric[list] as unknown[], from, to);
      swap(d.rowIds[list], from, to);
    });

  const save = () => {
    setTouched(true);
    if (issues.size > 0) {
      alertRef.current?.focus();
      return;
    }
    startTransition(async () => {
      const result = await saveRubricAction(roleId, rubric, version);
      if (result?.error) {
        setServerError(result.error);
        alertRef.current?.focus();
      }
    });
  };

  const issue = (path: string) => (touched ? issues.get(path) : undefined);
  const alert = serverError ?? (touched && issues.size > 0 ? `Fix ${issues.size} ${issues.size === 1 ? "problem" : "problems"} before saving.` : null);

  return (
    <div className="space-y-10">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur">
        <p className="text-sm text-muted-foreground">
          Editing v{version} · saving creates v{version + 1}
          {dirty ? " · unsaved changes" : ""}
        </p>
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : `Save v${version + 1}`}
        </Button>
      </div>

      <p ref={alertRef} tabIndex={-1} role="alert" className="text-sm text-destructive outline-none empty:hidden">
        {alert}
      </p>

      <Field label="Role summary" hint="context for the fit question" error={issue("roleSummary")}>
        {(props) => (
          <Textarea
            {...props}
            value={rubric.roleSummary}
            rows={3}
            onChange={(e) => update((d) => void (d.rubric.roleSummary = e.target.value))}
          />
        )}
      </Field>

      <Group
        title="Dimensions"
        hint="score questions"
        count={`${rubric.dimensions.length} / ${RUBRIC_LIMITS.minDimensions}–${RUBRIC_LIMITS.maxDimensions}`}
        error={issue("dimensions")}
        onAdd={
          rubric.dimensions.length < RUBRIC_LIMITS.maxDimensions
            ? () =>
                addRow("dimensions", {
                  key: uniqueKey("new_dimension", rubric.dimensions),
                  name: "",
                  instructions: "",
                  levels: LEVEL_LABELS.map((label) => ({ label, description: "" })),
                })
            : undefined
        }
      >
        {rubric.dimensions.map((dimension, i) => {
          const label = dimension.name || `Dimension ${i + 1}`;
          return (
            <div key={rowIds.dimensions[i]} className="rounded-xl border p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1">
                  <Field label={`${label} name`} srOnlyLabel error={issue(`dimensions.${i}.name`) ?? issue(`dimensions.${i}.key`)}>
                    {(props) => (
                      <Input
                        {...props}
                        value={dimension.name}
                        placeholder="Dimension name"
                        className="font-medium"
                        onChange={(e) =>
                          update((d) => {
                            d.rubric.dimensions[i].name = e.target.value;
                            rekeyIfNew("dimensions", d.rubric.dimensions, i, toKey(e.target.value) || "dimension");
                          })
                        }
                      />
                    )}
                  </Field>
                  <p className="font-mono text-xs text-muted-foreground">dim.{dimension.key}</p>
                </div>
                <RowControls
                  label={label}
                  onUp={i > 0 ? () => moveRow("dimensions", i, i - 1) : undefined}
                  onDown={i < rubric.dimensions.length - 1 ? () => moveRow("dimensions", i, i + 1) : undefined}
                  onRemove={() => removeRow("dimensions", i)}
                />
              </div>
              <div className="mt-3">
                <Field label={`${label} instructions`} srOnlyLabel error={issue(`dimensions.${i}.instructions`)}>
                  {(props) => (
                    <Textarea
                      {...props}
                      placeholder="What evidence should the model judge?"
                      value={dimension.instructions}
                      rows={2}
                      onChange={(e) => update((d) => void (d.rubric.dimensions[i].instructions = e.target.value))}
                    />
                  )}
                </Field>
              </div>
              <div className="mt-3 space-y-2">
                {dimension.levels.map((level, j) => (
                  <Field
                    key={level.label}
                    label={level.label}
                    inline
                    accessibleLabel={`${label}: ${level.label}`}
                    error={issue(`dimensions.${i}.levels.${j}.description`)}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        value={level.description}
                        onChange={(e) => update((d) => void (d.rubric.dimensions[i].levels[j].description = e.target.value))}
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          );
        })}
      </Group>

      {(Object.keys(STATEMENT_GROUPS) as (keyof typeof STATEMENT_GROUPS)[]).map((list) => {
        const group = STATEMENT_GROUPS[list];
        const items: Statement[] = rubric[list];
        return (
          <Group
            key={list}
            title={group.title}
            hint="predicate questions"
            count={`${items.length} / ${group.max}`}
            error={issue(list)}
            onAdd={items.length < group.max ? () => addRow(list, { key: uniqueKey("new_item", items), statement: "" }) : undefined}
          >
            {items.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
            {items.map((item, i) => (
              <div key={rowIds[list][i]} className="flex items-start gap-2">
                <div className="flex-1">
                  <Field
                    label={`${group.singular} ${i + 1}`}
                    srOnlyLabel
                    error={issue(`${list}.${i}.statement`) ?? issue(`${list}.${i}.key`)}
                  >
                    {(props) => (
                      <Input
                        {...props}
                        value={item.statement}
                        placeholder="An atomic statement checkable from a resume"
                        onChange={(e) =>
                          update((d) => {
                            d.rubric[list][i].statement = e.target.value;
                            rekeyIfNew(list, d.rubric[list], i, statementKey(e.target.value));
                          })
                        }
                      />
                    )}
                  </Field>
                </div>
                <RowControls label={`${group.singular} ${i + 1}`} onRemove={() => removeRow(list, i)} />
              </div>
            ))}
          </Group>
        );
      })}

      <Group title="Overall fit" hint="choice question">
        <Field label="Instructions" error={issue("fit.instructions")}>
          {(props) => (
            <Textarea
              {...props}
              value={rubric.fit.instructions}
              rows={2}
              onChange={(e) => update((d) => void (d.rubric.fit.instructions = e.target.value))}
            />
          )}
        </Field>
        {rubric.fit.options.map((option, i) => (
          <Field key={option.value} label={option.value} mono error={issue(`fit.options.${i}.description`)}>
            {(props) => (
              <Input
                {...props}
                value={option.description}
                onChange={(e) => update((d) => void (d.rubric.fit.options[i].description = e.target.value))}
              />
            )}
          </Field>
        ))}
      </Group>
    </div>
  );
}

function validate(rubric: RubricBody): Issues {
  const result = RubricBody.safeParse(rubric);
  const issues: Issues = new Map();
  if (!result.success) {
    for (const problem of result.error.issues) {
      const path = problem.path.join(".");
      if (!issues.has(path)) issues.set(path, problem.message);
    }
  }
  return issues;
}

type ControlProps = { id: string; "aria-invalid"?: true; "aria-describedby"?: string; "aria-label"?: string };

/** Label + control + error, with the error linked via aria-describedby (and kept out of the label). */
function Field({
  label,
  hint,
  mono,
  inline,
  srOnlyLabel,
  accessibleLabel,
  error,
  children,
}: {
  label: string;
  hint?: string;
  mono?: boolean;
  inline?: boolean;
  srOnlyLabel?: boolean;
  accessibleLabel?: string;
  error?: string;
  children: (props: ControlProps) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const control = children({
    id,
    ...(error ? { "aria-invalid": true as const, "aria-describedby": errorId } : {}),
    ...(accessibleLabel ? { "aria-label": accessibleLabel } : {}),
  });
  const labelClass = srOnlyLabel ? "sr-only" : mono ? "font-mono text-xs" : inline ? "text-sm font-medium" : "text-sm font-semibold";
  return (
    <div className={inline ? "grid gap-1 sm:grid-cols-[5.5rem_1fr] sm:items-center sm:gap-x-2" : "space-y-1.5"}>
      <label htmlFor={id} className={labelClass}>
        {label}
        {hint && <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">→ {hint}</span>}
      </label>
      {control}
      {error && (
        <p id={errorId} className={`text-xs text-destructive ${inline ? "sm:col-start-2" : ""}`}>
          {error}
        </p>
      )}
    </div>
  );
}

function Group({
  title,
  hint,
  count,
  error,
  onAdd,
  children,
}: {
  title: string;
  hint: string;
  count?: string;
  error?: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-baseline gap-2 text-sm font-semibold">
          {title}
          <span className="font-mono text-xs font-normal text-muted-foreground">→ {hint}</span>
          {count && <span className="text-xs font-normal text-muted-foreground">{count}</span>}
        </h2>
        {onAdd && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            + Add
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function RowControls({
  label,
  onUp,
  onDown,
  onRemove,
}: {
  label: string;
  onUp?: () => void;
  onDown?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      {(onUp || onDown) && (
        <>
          <Button variant="ghost" size="icon-sm" onClick={onUp} disabled={!onUp} aria-label={`Move ${label} up`}>
            ↑
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDown} disabled={!onDown} aria-label={`Move ${label} down`}>
            ↓
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={`Remove ${label}`}>
        ✕
      </Button>
    </div>
  );
}

/** Short key from a statement's first meaningful words, e.g. "built_evaluation_pipeline". */
function statementKey(statement: string): string {
  const words = statement.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => !KEY_STOP_WORDS.has(word)) ?? [];
  return toKey(words.slice(0, 4).join(" ")) || "item";
}

function toKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^[^a-z]+/, "")
    .replace(/_+$/g, "");
}

function uniqueKey(base: string, items: { key: string }[], ignoreIndex = -1): string {
  const taken = new Set(items.filter((_, i) => i !== ignoreIndex).map((item) => item.key));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}

function swap<T>(items: T[], a: number, b: number) {
  [items[a], items[b]] = [items[b], items[a]];
}
