# 02 — Generate a rubric from the JD

**What to build:** On a role, the developer clicks "Generate rubric". The balanced OpenAI model drafts a rubric from the JD using structured outputs and a worked example rubric (derived from the AI Engineer screening criteria — see the source plan's appendix). The rubric is saved as version 1, marked generated, and the role page shows it read-only: role summary, dimensions with their five level descriptions, must-haves, red flags, and fit options. A progress state shows while drafting; failures show a clear error.

See spec: User Stories 16–24; Implementation Decisions → OpenAI gateway, Architecture (structured outputs check).

**Blocked by:** 01 — Scaffold + create a role from pasted JD text

**Status:** ready-for-agent

- [ ] First step: confirm the balanced model accepts the Rubric schema via structured outputs; if exact-length constraints are rejected, send a relaxed schema, validate the full schema after parsing, retry once
- [ ] Generator prompt requires atomic, resume-checkable statements and forbids criteria on protected attributes (age, gender, nationality, college prestige)
- [ ] Generated rubric includes a 2–3 sentence role summary
- [ ] Output that still fails validation after retry surfaces a clear error; no invalid rubric is ever saved
- [ ] Rubric model is read from config (default balanced tier)
- [ ] Service test with the fake gateway: generate writes version 1 marked generated and updates the role's current version; invalid output → error, nothing written
- [ ] Manual check: paste an AI Engineer JD → rubric appears in under ~30 s with readable, role-specific level descriptions
