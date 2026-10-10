# 08 — Dev panel

**What to build:** Beside the scorecard (below it on mobile), a dev panel shows exactly what happened on the wire: the request body, the raw response, latency, input/output/total tokens, dollar cost, and the extracted resume text the model read. Copy buttons produce a curl command and a TypeScript SDK snippet that reproduce the call, referencing the key via environment variable — never inlined.

See spec: User Stories 49–55; Implementation Decisions → Snippets, Cost.

**Blocked by:** 03 — Score one resume end to end

**Status:** done (real-key curl check pending)

- [x] Request and Response tabs with readable, formatted JSON
- [x] Latency, token counts, and cost displayed
- [x] Extracted resume text viewable
- [x] Copy as curl and Copy as TypeScript; both use an environment variable for the key
- [x] Pure tests: snippets round-trip the request body and never contain the key
- [ ] Manual check: copy the curl, run it in a terminal with your key, get the same answer shape back — _**needs a real key**. Verified so far (headless Chrome): copy works and shows "Copied"; the copied curl body carries all questions and no key; running it with a fake key reached api.openai.com/v1/decisions and returned 401 invalid_api_key, so the command itself is valid_

## Comments

- 2026-10-10 — Implemented. Browser tests moved to headless Chrome (Playwright) after finding the automation Chrome window was hidden, which paused requestAnimationFrame and blocked hydration of streamed sections (the cause of earlier flaky clicks). Review fixes: total tokens shown; DevPanel is a server component with pre-stringified JSON (only tabs and copy are client); `runRequest`/`runUsage` accessors; copy timer cleaned up; status announced via role=status; named scrollable code blocks; heredoc-safety test.
