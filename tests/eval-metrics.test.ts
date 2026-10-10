import { describe, expect, it } from "vitest";
import { binaryAccuracy, brierBinary, brierMulticlass, confidentMisses, confusionMatrix, fitAccuracy, reliability } from "@/eval/metrics";

// Worked example, computed by hand:
//   A: expected strong,   predicted strong   (s .8, p .15, w .05) conf .8
//   B: expected weak,     predicted possible (s .1, p .6,  w .3)  conf .6
//   C: expected possible, predicted possible (s .2, p .7,  w .1)  conf .7
const fits = [
  { id: "A", expected: "strong_fit", predicted: "strong_fit", confidence: 0.8, probabilities: { strong_fit: 0.8, possible_fit: 0.15, weak_fit: 0.05 } },
  { id: "B", expected: "weak_fit", predicted: "possible_fit", confidence: 0.6, probabilities: { strong_fit: 0.1, possible_fit: 0.6, weak_fit: 0.3 } },
  { id: "C", expected: "possible_fit", predicted: "possible_fit", confidence: 0.7, probabilities: { strong_fit: 0.2, possible_fit: 0.7, weak_fit: 0.1 } },
];

// Must-haves: (p .9, true) (p .3, false) (p .6, false)
const predicates = [
  { expected: true, probability: 0.9 },
  { expected: false, probability: 0.3 },
  { expected: false, probability: 0.6 },
];

describe("eval metrics", () => {
  it("fit accuracy and confusion matrix (rows expected, columns predicted)", () => {
    expect(fitAccuracy(fits)).toBeCloseTo(2 / 3);
    expect(confusionMatrix(fits)).toEqual([
      [1, 0, 0],
      [0, 1, 0],
      [0, 1, 0],
    ]);
  });

  it("multi-class Brier score: mean over cases of Σ (p_k − y_k)²", () => {
    // A .065, B .86, C .14 → 1.065 / 3
    expect(brierMulticlass(fits)).toBeCloseTo(0.355, 6);
  });

  it("binary accuracy at 0.5 and binary Brier score", () => {
    expect(binaryAccuracy(predicates)).toBeCloseTo(2 / 3);
    // .01 + .09 + .36 = .46 → / 3
    expect(brierBinary(predicates)).toBeCloseTo(0.153333, 5);
  });

  it("reliability bins and expected calibration error", () => {
    const { bins, ece } = reliability(
      fits.map((f) => ({ confidence: f.confidence, correct: f.expected === f.predicted })),
      5,
    );
    expect(bins.filter((b) => b.count > 0)).toEqual([
      { from: 0.6, to: 0.8, count: 2, avgConfidence: 0.65, accuracy: 0.5 },
      { from: 0.8, to: 1, count: 1, avgConfidence: 0.8, accuracy: 1 },
    ]);
    // 2/3 · |.5 − .65| + 1/3 · |1 − .8| = .1 + .0667
    expect(ece).toBeCloseTo(0.166667, 5);
  });

  it("ranks wrong answers by confidence, most confident first", () => {
    const misses = confidentMisses(
      [
        { id: "x", correct: false, confidence: 0.55 },
        { id: "y", correct: true, confidence: 0.99 },
        { id: "z", correct: false, confidence: 0.9 },
      ],
      5,
    );
    expect(misses.map((m) => m.id)).toEqual(["z", "x"]);
  });
});
