# 04 — Rubric form editor + versioning

**What to build:** The developer opens a rubric editor for a role and edits it in a form: add, remove, and reorder dimensions; edit each dimension's name, instructions, and five level descriptions; add, edit, and remove must-haves and red flags; edit the role summary and the three fit option descriptions. Validation mirrors the schema limits so an invalid rubric cannot be saved. Saving writes a new version marked edited; earlier versions remain untouched on disk.

See spec: User Stories 25–32; Implementation Decisions → Store (immutable versions), Role service (save rubric).

**Blocked by:** 02 — Generate a rubric from the JD

**Status:** ready-for-agent

- [ ] Form-only editor (no JSON tab) covering every rubric field
- [ ] Level labels are fixed and not editable; only their descriptions are
- [ ] Inline validation for counts (3–8 dimensions, ≤ 8 must-haves, ≤ 6 red flags), required text, and unique snake_case keys
- [ ] Save writes the next version marked edited and updates the role's current version
- [ ] Service test: saving leaves the prior version file byte-identical and bumps the version
- [ ] Manual check: edit a level description → save → v2 shown; v1 file unchanged on disk
