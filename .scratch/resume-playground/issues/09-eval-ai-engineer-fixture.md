# 09 — Eval: AI Engineer fixture + eval command

**What to build:** A single command scores a labelled synthetic resume set and writes a Markdown report plus a JSON results file. This ticket delivers the AI Engineer fixture: a JD, a rubric generated once through the app and then frozen, ~12 synthetic resumes covering every profile, and labels. The report shows overall-fit accuracy with a confusion matrix, must-have accuracy at 0.5, binary and multi-class Brier scores, a reliability table with ECE, and the most confident misses.

**Needs the owner:** Kumar reviews the frozen rubric and writes/approves every label before commit.

See spec: User Stories 56–64; Implementation Decisions → Eval runner + metrics.

**Blocked by:** 03 — Score one resume end to end

**Status:** done (label approval + real-key run pending)

- [x] Fixture: JD, frozen rubric, ~12 resumes (3 clear fit, 3 clear miss, 2 borderline, 2 keyword-stuffed, 1 adjacent role, 1 prompt-injection attempt); all names, companies, contacts fictional
- [ ] Labels: expected fit and expected must-have truth values per resume, approved by Kumar — _**drafts written; waiting for Kumar's approval** (please confirm 10-arjun-nair). Frozen rubric is the hand-written AI Engineer rubric (`source: edited`); re-freeze after a real-key generation via `scripts/freeze-rubric.ts` if preferred_
- [x] Eval scores via the same service scoring path, using the frozen rubric (no generation at eval time)
- [x] Report: fit accuracy + 3×3 confusion; must-have accuracy; Brier (binary + multi-class); reliability bins + ECE; top 5 confident misses
- [x] Pure tests for every metric against small hand-computed cases
- [ ] Manual check: run the eval → report written; the prompt-injection resume is not scored strong_fit — _report written (`OPENAI_MOCK=1 pnpm eval` verified end to end); **injection check needs a real key** since mock answers are random_

## Comments

- 2026-10-10 — Implemented `pnpm eval` (fixtures loader, evaluator via the role service, metrics, Markdown + JSON report). Review fixes: unanswered must-haves count as wrong (reported separately); `installRubric` service method instead of writing the store from the harness; typed fit values; CLI error handling; rubric honestly marked `edited`. Reviewer disputed two draft labels; the resumes were adjusted so each label is unambiguous (08 now misses only one must-have; 07's bot is a prototype that never shipped).
