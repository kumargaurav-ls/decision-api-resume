import { Pill } from "./scorecard/badges";

/** Marks a run scored on an older rubric version than the role's current one. */
export function StaleBadge({ version }: { version: number }) {
  return <Pill tone="caution">Scored on rubric v{version}</Pill>;
}
