# 04 — Rubric form editor + versioning

**What to build:** The developer opens a rubric editor for a role and edits it in a form: add, remove, and reorder dimensions; edit each dimension's name, instructions, and five level descriptions; add, edit, and remove must-haves and red flags; edit the role summary and the three fit option descriptions. Validation mirrors the schema limits so an invalid rubric cannot be saved. Saving writes a new version marked edited; earlier versions remain untouched on disk.

See spec: User Stories 25–32; Implementation Decisions → Store (immutable versions), Role service (save rubric).

**Blocked by:** 02 — Generate a rubric from the JD

**Status:** done

- [x] Form-only editor (no JSON tab) covering every rubric field
- [x] Level labels are fixed and not editable; only their descriptions are
- [x] Inline validation for counts (3–8 dimensions, ≤ 8 must-haves, ≤ 6 red flags), required text, and unique snake_case keys
- [x] Save writes the next version marked edited and updates the role's current version
- [x] Service test: saving leaves the prior version file byte-identical and bumps the version
- [x] Manual check: edit a level description → save → v2 shown; v1 file unchanged on disk — _browser-tested (mock mode): edit level, reorder, add must-have/red flag, save v2→v4; v1 checksum unchanged throughout_

## Comments

- 2026-10-09 — Implemented. Review fixes: keys must be true snake_case; statement-key errors shown inline; saves on a stale base version are refused; stable client row ids so focus follows moved rows; errors linked via aria-describedby and kept out of labels; one zod-issue formatter; `FormState` → `ActionState`. Browser test found and fixed a bug where a new row could keep a placeholder key that existed in another list.
