export const DEFAULT_RUBRIC_MODEL = "gpt-6.1-sol";
export const DEFAULT_DECISION_MODEL = "gpt-6-luna";

export type Config = {
  openaiApiKey: string | null;
  /** Canned OpenAI responses; lets the app run without a key. */
  mockMode: boolean;
  rubricModel: string;
  decisionModel: string;
  lowConfidenceThreshold: number;
  dataDir: string;
  privateEvalDir: string | null;
  runLive: boolean;
};

export type ConfigResult =
  | { ok: true; config: Config }
  | { ok: false; missing: string[]; invalid: string[] };

type Env = Record<string, string | undefined>;

export function loadConfig(env: Env = process.env): ConfigResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  const mockMode = isTruthy(env.OPENAI_MOCK);
  const openaiApiKey = blankToNull(env.OPENAI_API_KEY);
  if (!openaiApiKey && !mockMode) missing.push("OPENAI_API_KEY");

  const thresholdRaw = blankToNull(env.LOW_CONFIDENCE_THRESHOLD);
  const lowConfidenceThreshold = thresholdRaw === null ? 0.6 : Number(thresholdRaw);
  if (!Number.isFinite(lowConfidenceThreshold) || lowConfidenceThreshold < 0 || lowConfidenceThreshold > 1) {
    invalid.push("LOW_CONFIDENCE_THRESHOLD");
  }

  if (missing.length || invalid.length) return { ok: false, missing, invalid };

  return {
    ok: true,
    config: {
      openaiApiKey,
      mockMode,
      rubricModel: blankToNull(env.OPENAI_RUBRIC_MODEL) ?? DEFAULT_RUBRIC_MODEL,
      decisionModel: blankToNull(env.OPENAI_DECISION_MODEL) ?? DEFAULT_DECISION_MODEL,
      lowConfidenceThreshold,
      dataDir: blankToNull(env.DATA_DIR) ?? "./data",
      privateEvalDir: blankToNull(env.PRIVATE_EVAL_DIR),
      runLive: isTruthy(env.RUN_LIVE),
    },
  };
}

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isTruthy(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}
