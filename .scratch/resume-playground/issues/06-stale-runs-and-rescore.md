# 06 — Stale runs + re-score

**What to build:** When the rubric has moved on since a resume was scored, that run is marked "Scored on rubric vN" in the role's history and on the run page. A Re-score action reuses the stored resume text against the current rubric and creates a new run, so the developer can compare the effect of a rubric edit side by side.

See spec: User Stories 40–41; Implementation Decisions → Role service (re-score).

**Blocked by:** 03 — Score one resume end to end; 04 — Rubric form editor + versioning

**Status:** ready-for-agent

- [ ] Runs whose rubric version is older than the role's current version show a stale chip
- [ ] Re-score uses stored resume text (no re-upload) and the current rubric, creating a new run; the original run is unchanged
- [ ] Service tests: stale detection; re-score creates a new run on the current version
- [ ] Manual check: score a resume → edit rubric → old run shows stale → re-score → new run appears
