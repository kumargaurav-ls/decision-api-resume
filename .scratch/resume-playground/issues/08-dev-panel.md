# 08 — Dev panel

**What to build:** Beside the scorecard (below it on mobile), a dev panel shows exactly what happened on the wire: the request body, the raw response, latency, input/output/total tokens, dollar cost, and the extracted resume text the model read. Copy buttons produce a curl command and a TypeScript SDK snippet that reproduce the call, referencing the key via environment variable — never inlined.

See spec: User Stories 49–55; Implementation Decisions → Snippets, Cost.

**Blocked by:** 03 — Score one resume end to end

**Status:** ready-for-agent

- [ ] Request and Response tabs with readable, formatted JSON
- [ ] Latency, token counts, and cost displayed
- [ ] Extracted resume text viewable
- [ ] Copy as curl and Copy as TypeScript; both use an environment variable for the key
- [ ] Pure tests: snippets round-trip the request body and never contain the key
- [ ] Manual check: copy the curl, run it in a terminal with your key, get the same answer shape back
