# 07 — Full scorecard UI

**What to build:** The run page becomes the teaching scorecard. Overall fit shows the chosen option, probabilities for all three options, and confidence. Each dimension shows a probability bar per level plus its fractional score. Must-haves and red flags show their probability with a tick or cross at 0.5. Answers below the low-confidence threshold carry a badge; refused questions show as "declined" while other answers still render. A persistent "Suggestion only — a human decides" note sits on the scorecard. Works in light and dark (system preference) and at phone width.

Load the `apple-design` and `design-taste-frontend` skills before starting.

See spec: User Stories 42–48; Implementation Decisions → Architecture (visual direction).

**Blocked by:** 03 — Score one resume end to end

**Status:** ready-for-agent

- [ ] Fit card with per-option probabilities and confidence
- [ ] Dimension rows with five-level probability bars and fractional score
- [ ] Predicate rows with probability and tick/cross at 0.5
- [ ] Low-confidence badge driven by the configured threshold
- [ ] Refusal state per question
- [ ] Human-decides banner always visible
- [ ] Apple-style tokens: neutral greys, single blue accent, system/Inter type; light + dark; no horizontal scroll at phone width
- [ ] Manual check: view a run with a refusal and a low-confidence answer in both themes and at phone width
