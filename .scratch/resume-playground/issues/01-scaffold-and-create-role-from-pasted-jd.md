# 01 — Scaffold + create a role from pasted JD text

**What to build:** A developer clones the repo, installs, and runs the dev server. With no OpenAI key configured they see a friendly setup screen explaining what to set. With a key, they see the roles list (with an empty state), can create a role by entering a title and pasting job description text, and see it appear in the list. This ticket also lays the testing foundation every later ticket relies on: the role service as the tested surface, the file-backed store, the shared schemas, the OpenAI gateway interface with a fake, and a temporary-data-directory helper.

See spec: Implementation Decisions → Config, Schemas, Store, OpenAI gateway, Role service; Testing Decisions.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui + Vitest project boots with pnpm
- [x] Example env file lists every setting (key, rubric model, decision model, low-confidence threshold, data dir, private eval dir, live flag) with defaults from the spec
- [x] Config validates env at boot; a missing OpenAI key renders a setup screen, not an error page — _validated per request (cached), verified in browser + curl with no env_
- [x] Rubric, Role, and Run schemas exist and enforce the limits in the spec (3–8 dimensions, exactly five fixed level labels, ≤ 8 must-haves, ≤ 6 red flags, exactly three fit options)
- [x] Store persists roles, JD text, rubric versions, runs, and resume text under the data dir with atomic writes; data dir is gitignored
- [x] OpenAI gateway interface defined (draft rubric, send decision) with a fake factory for tests; no other module talks to OpenAI — _plus an opt-in mock gateway (`OPENAI_MOCK=1`) for running without a key_
- [x] Role service supports "create role from pasted text"; roles list shows title, rubric version (none yet) and run count
- [x] Tests at the service level, using the fake gateway and a temp data dir, cover create-role and list-roles
- [x] Manual check: no key → setup screen; with key → create a role from pasted JD → it appears in the list and its files exist on disk — _browser-tested in mock mode (no real key available to me)_

## Comments

- 2026-10-09 — Implemented. Code review (standards + spec) findings fixed: layout gate moved to a sibling Suspense boundary so page shells prerender; mock mode wired to a real canned gateway; role lookup no longer swallows errors; store helpers de-duplicated; tests assert files on disk. Deferred: `server-only` on store/config (imported by Vitest and the eval CLI); auth on Server Actions (local-only app).
