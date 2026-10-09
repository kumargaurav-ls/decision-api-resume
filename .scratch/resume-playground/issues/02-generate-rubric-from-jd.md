# 02 — Generate a rubric from the JD

**What to build:** On a role, the developer clicks "Generate rubric". The balanced OpenAI model drafts a rubric from the JD using structured outputs and a worked example rubric (derived from the AI Engineer screening criteria — see the source plan's appendix). The rubric is saved as version 1, marked generated, and the role page shows it read-only: role summary, dimensions with their five level descriptions, must-haves, red flags, and fit options. A progress state shows while drafting; failures show a clear error.

See spec: User Stories 16–24; Implementation Decisions → OpenAI gateway, Architecture (structured outputs check).

**Blocked by:** 01 — Scaffold + create a role from pasted JD text

**Status:** done (live-key checks pending)

- [ ] First step: confirm the balanced model accepts the Rubric schema via structured outputs; if exact-length constraints are rejected, send a relaxed schema, validate the full schema after parsing, retry once — _**live confirmation still owed (needs a real key)**. The fallback path is implemented and used unconditionally: relaxed schema sent, full schema enforced after parsing, one retry; a test confirms the draft schema converts to a strict `json_schema` format_
- [x] Generator prompt requires atomic, resume-checkable statements and forbids criteria on protected attributes (age, gender, nationality, college prestige)
- [x] Generated rubric includes a 2–3 sentence role summary — _requested in the prompt; schema only requires it to be non-empty_
- [x] Output that still fails validation after retry surfaces a clear error; no invalid rubric is ever saved
- [x] Rubric model is read from config (default balanced tier)
- [x] Service test with the fake gateway: generate writes version 1 marked generated and updates the role's current version; invalid output → error, nothing written
- [ ] Manual check: paste an AI Engineer JD → rubric appears in under ~30 s with readable, role-specific level descriptions — _**needs a real key**. Browser-tested in mock mode: Generate → "Drafting rubric…" progress → v1 rendered read-only with all five level descriptions per dimension_

## Comments

- 2026-10-09 — Implemented. Review fixes: named retry constant, model refusal (null output) reported distinctly, shared `Statement` type in the view, system prompt passed via the Responses API `instructions` param. Also added an ESLint rule allowing `_`-prefixed unused args (needed by `useActionState` action signatures).
