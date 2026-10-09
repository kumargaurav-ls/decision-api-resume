import type { Decision } from "../gateway";

/** Decisions API pricing (gpt-6-luna, beta): $0.10 per million input tokens; output is free. */
export const USD_PER_MILLION_INPUT_TOKENS = 0.1;

export function costUsd(usage: Decision["usage"]): number {
  return (usage.input_tokens * USD_PER_MILLION_INPUT_TOKENS) / 1_000_000;
}
