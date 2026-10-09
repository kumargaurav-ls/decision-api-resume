/** Marks a run scored on an older rubric version than the role's current one. */
export function StaleBadge({ version }: { version: number }) {
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      Scored on rubric v{version}
    </span>
  );
}
