# 07 — Full scorecard UI

**What to build:** The run page becomes the teaching scorecard. Overall fit shows the chosen option, probabilities for all three options, and confidence. Each dimension shows a probability bar per level plus its fractional score. Must-haves and red flags show their probability with a tick or cross at 0.5. Answers below the low-confidence threshold carry a badge; refused questions show as "declined" while other answers still render. A persistent "Suggestion only — a human decides" note sits on the scorecard. Works in light and dark (system preference) and at phone width.

Load the `apple-design` and `design-taste-frontend` skills before starting.

See spec: User Stories 42–48; Implementation Decisions → Architecture (visual direction).

**Blocked by:** 03 — Score one resume end to end

**Status:** done

- [x] Fit card with per-option probabilities and confidence
- [x] Dimension rows with five-level probability bars and fractional score
- [x] Predicate rows with probability and tick/cross at 0.5
- [x] Low-confidence badge driven by the configured threshold
- [x] Refusal state per question
- [x] Human-decides banner always visible
- [x] Apple-style tokens: neutral greys, single blue accent, system/Inter type; light + dark; no horizontal scroll at phone width
- [x] Manual check: view a run with a refusal and a low-confidence answer in both themes and at phone width — _browser-tested (mock mode): light, dark (dark media rules forced), and a 390px iframe with no horizontal scroll_

## Comments

- 2026-10-09 — Implemented with the `apple-design` and `design-taste-frontend` skills loaded. Design read: internal developer learning tool, calm Apple-style restraint; system font, neutral greys, one blue `signal` accent, plus an amber `caution` token used only for low confidence and stale runs. Review fixes: absolute (not normalised) level heights so the weighted score lesson holds; score marker aligned to column centres; red-flag colours follow meaning; no pure white surfaces; muted text darkened to pass WCAG AA on muted fills; stale/mock banners moved onto the caution token; removed em-dashes from visible copy (taste skill rule). A CSS edit was briefly broken mid-review and restored from the index.
