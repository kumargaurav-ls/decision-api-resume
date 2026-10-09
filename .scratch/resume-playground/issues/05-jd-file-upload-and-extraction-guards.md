# 05 — JD file upload + extraction guards

**What to build:** The developer can create a role by uploading a JD as PDF or DOCX instead of pasting, and sees the extracted text with a character count before generating. Both JD and resume uploads now reject unusable files with distinct, clear messages: image-only (scanned) PDFs, legacy .doc files, unsupported types, and files over 5 MB. Rejections happen before any API call.

See spec: User Stories 12–15, 37; Implementation Decisions → Extractor.

**Blocked by:** 03 — Score one resume end to end

**Status:** ready-for-agent

- [ ] New-role screen offers paste or upload; upload shows extracted-text preview and character count
- [ ] Image-only PDF detection: reject when trimmed text is under 200 characters or under 40 characters per page
- [ ] Distinct user-facing messages for scanned PDF, .doc, unsupported type, oversize
- [ ] Same guards apply to resume uploads; a rejected resume makes no Decisions call
- [ ] Extractor tests against real fixture files: text PDF, DOCX, image-only PDF, .doc, oversized file
- [ ] Manual check: upload a scanned PDF as JD and as resume → clear rejection both times
