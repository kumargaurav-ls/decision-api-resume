# 11 — README, cheatsheet + final polish

**What to build:** A developer who has never seen the project can follow the README from a fresh clone to a scored fixture resume in about five minutes. The README explains what the Decisions API is, how a rubric maps to its three question types, how to read the scorecard and dev panel, how to run the eval, and warns to use test or synthetic resumes only because resume text is sent to OpenAI. A short cheatsheet covers request/response shapes. Every page gets empty, loading, and error states, keyboard focus, and reduced-motion handling.

Load the `apple-design` and `design-taste-frontend` skills for the final UI pass.

See spec: User Stories 1, 6–8; Further Notes.

**Blocked by:** 05 — JD file upload + extraction guards; 06 — Stale runs + re-score; 07 — Full scorecard UI; 08 — Dev panel; 10 — Eval: second role + private mode

**Status:** done

- [x] README: setup, concept, rubric → question mapping, scorecard and dev panel guide, eval, test-resumes-only warning, human-in-the-loop framing
- [x] Decisions API cheatsheet for developers
- [x] Empty, loading, and error states on every page; visible keyboard focus; reduced-motion respected
- [x] Manual check: fresh clone in a temp directory → follow README only → score a fixture resume in under 5 minutes — _fresh `git clone` → `pnpm install` (6 s) → `.env.local` with `OPENAI_MOCK=1` → `pnpm build` passes → `pnpm dev` → paste JD, generate rubric, upload `eval/sample-uploads` PDF → scorecard in 6.1 s, no page errors (mock mode; no real key available)_

## Comments

- 2026-10-10 — Implemented with `apple-design` and `design-taste-frontend` loaded. Review fixes: error boundary uses `retry()` (Next 16 docs), `global-error.tsx` added, accent focus outline on every interactive element (shadcn controls included; base outline made opaque), skeletons with a single accessible label, README human-in-the-loop section. Found and removed test artifacts accidentally committed in ticket 08 (screenshots, copied curl with fictional resume; no key). Turbopack's dev cache served stale CSS twice during testing; README troubleshooting covers it.
