import type { Decision, DecisionCreateParams } from "../gateway";
import type { Rubric } from "../schemas/rubric";
import { questionName } from "./build-questions";

export type ScoreAnswer = {
  kind: "score";
  score: number;
  confidence: number;
  lowConfidence: boolean;
  levels: { label: string; probability: number }[];
};
export type PredicateAnswer = { kind: "predicate"; probability: number; holds: boolean; lowConfidence: boolean };
export type ChoiceAnswer = {
  kind: "choice";
  choice: string;
  confidence: number;
  lowConfidence: boolean;
  options: { value: string; probability: number }[];
};
export type Unanswered = { kind: "refusal" } | { kind: "missing" };

export type Scorecard = {
  fit: ChoiceAnswer | Unanswered;
  dimensions: { key: string; name: string; answer: ScoreAnswer | Unanswered }[];
  mustHaves: { key: string; statement: string; answer: PredicateAnswer | Unanswered }[];
  redFlags: { key: string; statement: string; answer: PredicateAnswer | Unanswered }[];
};

type RawAnswer = Decision["answers"][number];

/** Turns a raw Decision into the scorecard view model, matching answers by question name. */
export function toScorecard(rubric: Rubric, response: Decision, lowConfidenceThreshold: number): Scorecard {
  const byName = new Map(response.answers.map((answer) => [answer.name, answer]));
  const isLow = (confidence: number) => confidence < lowConfidenceThreshold;

  const score = (raw: RawAnswer | undefined): ScoreAnswer | Unanswered => {
    if (raw?.type === "refusal") return { kind: "refusal" };
    if (raw?.type !== "score") return { kind: "missing" };
    return {
      kind: "score",
      score: raw.score,
      confidence: raw.confidence,
      lowConfidence: isLow(raw.confidence),
      levels: raw.probabilities.map((level) => ({ label: level.label, probability: level.probability })),
    };
  };

  // Predicates carry no confidence from the API. We treat distance from a coin flip,
  // max(p, 1 − p), as their confidence so near-even answers get the low-confidence badge.
  const predicate = (raw: RawAnswer | undefined): PredicateAnswer | Unanswered => {
    if (raw?.type === "refusal") return { kind: "refusal" };
    if (raw?.type !== "predicate") return { kind: "missing" };
    return {
      kind: "predicate",
      probability: raw.probability,
      holds: raw.probability >= 0.5,
      lowConfidence: isLow(Math.max(raw.probability, 1 - raw.probability)),
    };
  };

  const choice = (raw: RawAnswer | undefined): ChoiceAnswer | Unanswered => {
    if (raw?.type === "refusal") return { kind: "refusal" };
    if (raw?.type !== "choice") return { kind: "missing" };
    return {
      kind: "choice",
      choice: String(raw.choice),
      confidence: raw.confidence,
      lowConfidence: isLow(raw.confidence),
      options: raw.probabilities.map((option) => ({ value: String(option.value), probability: option.probability })),
    };
  };

  return {
    fit: choice(byName.get(questionName.fit)),
    dimensions: rubric.dimensions.map((dimension) => ({
      key: dimension.key,
      name: dimension.name,
      answer: score(byName.get(questionName.dimension(dimension.key))),
    })),
    mustHaves: rubric.mustHaves.map((item) => ({
      key: item.key,
      statement: item.statement,
      answer: predicate(byName.get(questionName.mustHave(item.key))),
    })),
    redFlags: rubric.redFlags.map((item) => ({
      key: item.key,
      statement: item.statement,
      answer: predicate(byName.get(questionName.redFlag(item.key))),
    })),
  };
}

/** A run's stored response as a Decision (the store keeps it as opaque JSON). */
export function runDecision(run: { response: unknown }): Decision | null {
  return (run.response as Decision | null) ?? null;
}

/** A run's stored request as the Decisions request body it was. */
export function runRequest(run: { request: unknown }): DecisionCreateParams {
  return run.request as DecisionCreateParams;
}

/** Token usage of a run's response, or null when the call failed. */
export function runUsage(run: { response: unknown }): { input: number; output: number; total: number } | null {
  const usage = runDecision(run)?.usage;
  return usage ? { input: usage.input_tokens, output: usage.output_tokens, total: usage.total_tokens } : null;
}

/** The overall-fit answer alone, for history lists (no rubric needed). */
export function fitSummary(run: { response: unknown }): { choice: string; confidence: number } | null {
  const answer = runDecision(run)?.answers.find((a) => a.name === questionName.fit);
  return answer?.type === "choice" ? { choice: String(answer.choice), confidence: answer.confidence } : null;
}
