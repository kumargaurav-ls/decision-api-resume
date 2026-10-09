# 09 — Eval: AI Engineer fixture + eval command

**What to build:** A single command scores a labelled synthetic resume set and writes a Markdown report plus a JSON results file. This ticket delivers the AI Engineer fixture: a JD, a rubric generated once through the app and then frozen, ~12 synthetic resumes covering every profile, and labels. The report shows overall-fit accuracy with a confusion matrix, must-have accuracy at 0.5, binary and multi-class Brier scores, a reliability table with ECE, and the most confident misses.

**Needs the owner:** Kumar reviews the frozen rubric and writes/approves every label before commit.

See spec: User Stories 56–64; Implementation Decisions → Eval runner + metrics.

**Blocked by:** 03 — Score one resume end to end

**Status:** ready-for-agent

- [ ] Fixture: JD, frozen rubric, ~12 resumes (3 clear fit, 3 clear miss, 2 borderline, 2 keyword-stuffed, 1 adjacent role, 1 prompt-injection attempt); all names, companies, contacts fictional
- [ ] Labels: expected fit and expected must-have truth values per resume, approved by Kumar
- [ ] Eval scores via the same service scoring path, using the frozen rubric (no generation at eval time)
- [ ] Report: fit accuracy + 3×3 confusion; must-have accuracy; Brier (binary + multi-class); reliability bins + ECE; top 5 confident misses
- [ ] Pure tests for every metric against small hand-computed cases
- [ ] Manual check: run the eval → report written; the prompt-injection resume is not scored strong_fit
