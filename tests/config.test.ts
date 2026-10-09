import { describe, expect, it } from "vitest";
import { loadConfig } from "@/lib/config";

describe("config", () => {
  it("reports a missing OpenAI key as a setup problem", () => {
    const result = loadConfig({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.missing).toEqual(["OPENAI_API_KEY"]);
  });

  it("applies the spec defaults when only the key is set", () => {
    const result = loadConfig({ OPENAI_API_KEY: "sk-test" });
    expect(result).toEqual({
      ok: true,
      config: {
        openaiApiKey: "sk-test",
        mockMode: false,
        rubricModel: "gpt-6.1-sol",
        decisionModel: "gpt-6-luna",
        lowConfidenceThreshold: 0.6,
        dataDir: "./data",
        privateEvalDir: null,
        runLive: false,
      },
    });
  });

  it("allows running without a key in mock mode", () => {
    const result = loadConfig({ OPENAI_MOCK: "1" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.mockMode).toBe(true);
      expect(result.config.openaiApiKey).toBeNull();
    }
  });

  it("rejects a threshold outside 0..1", () => {
    const result = loadConfig({ OPENAI_API_KEY: "sk", LOW_CONFIDENCE_THRESHOLD: "1.5" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalid).toEqual(["LOW_CONFIDENCE_THRESHOLD"]);
  });
});
