/** 0.374 → "37%" */
export function percent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}
