# 11 — README, cheatsheet + final polish

**What to build:** A developer who has never seen the project can follow the README from a fresh clone to a scored fixture resume in about five minutes. The README explains what the Decisions API is, how a rubric maps to its three question types, how to read the scorecard and dev panel, how to run the eval, and warns to use test or synthetic resumes only because resume text is sent to OpenAI. A short cheatsheet covers request/response shapes. Every page gets empty, loading, and error states, keyboard focus, and reduced-motion handling.

Load the `apple-design` and `design-taste-frontend` skills for the final UI pass.

See spec: User Stories 1, 6–8; Further Notes.

**Blocked by:** 05 — JD file upload + extraction guards; 06 — Stale runs + re-score; 07 — Full scorecard UI; 08 — Dev panel; 10 — Eval: second role + private mode

**Status:** ready-for-agent

- [ ] README: setup, concept, rubric → question mapping, scorecard and dev panel guide, eval, test-resumes-only warning, human-in-the-loop framing
- [ ] Decisions API cheatsheet for developers
- [ ] Empty, loading, and error states on every page; visible keyboard focus; reduced-motion respected
- [ ] Manual check: fresh clone in a temp directory → follow README only → score a fixture resume in under 5 minutes
