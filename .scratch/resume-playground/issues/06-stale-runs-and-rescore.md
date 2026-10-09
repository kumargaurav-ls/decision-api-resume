# 06 — Stale runs + re-score

**What to build:** When the rubric has moved on since a resume was scored, that run is marked "Scored on rubric vN" in the role's history and on the run page. A Re-score action reuses the stored resume text against the current rubric and creates a new run, so the developer can compare the effect of a rubric edit side by side.

See spec: User Stories 40–41; Implementation Decisions → Role service (re-score).

**Blocked by:** 03 — Score one resume end to end; 04 — Rubric form editor + versioning

**Status:** done

- [x] Runs whose rubric version is older than the role's current version show a stale chip
- [x] Re-score uses stored resume text (no re-upload) and the current rubric, creating a new run; the original run is unchanged
- [x] Service tests: stale detection; re-score creates a new run on the current version
- [x] Manual check: score a resume → edit rubric → old run shows stale → re-score → new run appears — _browser-tested (mock mode): v1 runs flagged while rubric is v4; re-score created a v4 run; run page banner offers "Re-score on v4"_

## Comments

- 2026-10-09 — Implemented. Scoring shares one `decideAndSave` path between upload and re-score. Review fixes: removed the now-unused `listRuns` service method, named `RunHistoryItem` type, shared `StaleBadge`, hover limited to the navigable part of the row.
