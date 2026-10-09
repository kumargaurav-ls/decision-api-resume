# 10 — Eval: second role + private mode

**What to build:** A second fixture for a non-AI role (Senior React Developer) proves the JD-first design generalises, and the eval reports per fixture. A private mode reads fixtures from a directory outside the repo (same layout; PDF/DOCX resumes are extracted) so the owner can check against real data without committing it; it fails with a clear message when the directory isn't configured. A few fixture resumes are also committed as real PDF and DOCX files for exercising the upload path by hand.

**Needs the owner:** Kumar approves the second frozen rubric and labels.

See spec: User Stories 57, 65–66.

**Blocked by:** 09 — Eval: AI Engineer fixture + eval command

**Status:** ready-for-agent

- [ ] React developer fixture: JD, frozen rubric, ~12 resumes across the same six profiles, labels approved by Kumar
- [ ] Report sections per fixture plus an overall summary
- [ ] Private flag reads the configured private directory; unset → clear error, no empty report
- [ ] Private fixtures may contain PDF/DOCX resumes, extracted with the same guards
- [ ] 3–4 fixture resumes committed as text-based PDF and DOCX
- [ ] Manual check: eval over both fixtures; private flag with and without the directory set
