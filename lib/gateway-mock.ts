import { createHash } from "node:crypto";
import type { Decision, DecisionCreateParams, OpenAIGateway } from "./gateway";
import { EXAMPLE_RUBRIC } from "./rubric/example-rubric";

/**
 * Mock mode (OPENAI_MOCK=1): canned but input-dependent responses so the UI can be
 * explored without an API key. Answers are deterministic per (resume, question).
 */
export function createMockGateway(): OpenAIGateway {
  return {
    async draftRubric(jdText) {
      await delay(400);
      const firstSentence = jdText.split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
      return { ...EXAMPLE_RUBRIC, roleSummary: firstSentence || EXAMPLE_RUBRIC.roleSummary };
    },
    async decide(request) {
      await delay(250);
      const input = typeof request.input === "string" ? request.input : JSON.stringify(request.input);
      const answers = request.questions.map((question, index) => mockAnswer(question, `${input}::${question.name ?? index}`));
      const inputTokens = Math.ceil((input.length + JSON.stringify(request.questions).length) / 4);
      return {
        model: request.model,
        answers,
        usage: {
          input_tokens: inputTokens,
          input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
          output_tokens: 0,
          output_tokens_details: { reasoning_tokens: 0 },
          total_tokens: inputTokens,
        },
      } satisfies Decision;
    },
  };
}

type Question = DecisionCreateParams["questions"][number];

function mockAnswer(question: Question, seed: string): Decision["answers"][number] {
  const random = seededRandom(seed);
  const name = question.name ?? null;
  if (random() < 0.04) return { type: "refusal", name };

  if (question.type === "predicate") {
    return { type: "predicate", name, probability: round(random()) };
  }
  if (question.type === "choice") {
    const probabilities = normalise(question.choices.map(() => random() ** 2));
    const best = argmax(probabilities);
    return {
      type: "choice",
      name,
      choice: question.choices[best].value,
      confidence: round(probabilities[best]),
      probabilities: question.choices.map((choice, i) => ({ value: choice.value, probability: round(probabilities[i]) })),
    };
  }
  const probabilities = normalise(question.levels.map(() => random() ** 2));
  const score = probabilities.reduce((sum, p, i) => sum + p * i, 0);
  return {
    type: "score",
    name,
    score: round(score),
    confidence: round(Math.max(...probabilities)),
    probabilities: question.levels.map((level, i) => ({ label: level.label, value: i, probability: round(probabilities[i]) })),
  };
}

function seededRandom(seed: string): () => number {
  let state = createHash("sha256").update(seed).digest().readUInt32LE(0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 10_000) / 10_000;
  };
}

function normalise(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  return values.map((v) => v / total);
}

function argmax(values: number[]): number {
  return values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
