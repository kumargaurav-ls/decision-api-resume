# 05 — JD file upload + extraction guards

**What to build:** The developer can create a role by uploading a JD as PDF or DOCX instead of pasting, and sees the extracted text with a character count before generating. Both JD and resume uploads now reject unusable files with distinct, clear messages: image-only (scanned) PDFs, legacy .doc files, unsupported types, and files over 5 MB. Rejections happen before any API call.

See spec: User Stories 12–15, 37; Implementation Decisions → Extractor.

**Blocked by:** 03 — Score one resume end to end

**Status:** done

- [x] New-role screen offers paste or upload; upload shows extracted-text preview and character count
- [x] Image-only PDF detection: reject when trimmed text is under 200 characters or under 40 characters per page
- [x] Distinct user-facing messages for scanned PDF, .doc, unsupported type, oversize
- [x] Same guards apply to resume uploads; a rejected resume makes no Decisions call
- [x] Extractor tests against real fixture files: text PDF, DOCX, image-only PDF, .doc, oversized file
- [x] Manual check: upload a scanned PDF as JD and as resume → clear rejection both times — _browser-tested (mock mode); also .doc resume → specific rejection, DOCX JD → preview + count → role created_

## Comments

- 2026-10-09 — Implemented. Browser test found and fixed: form-submitted JD text gained CRLF (preview 538 vs stored 558 chars). Review fixes: source toggle uses aria-pressed buttons (no partial tab pattern); invalid JD source fails loudly; empty DOCX rejected like a scanned PDF; real `.doc` and empty-DOCX fixtures; tests that .doc/oversize/empty resumes make no Decisions call; shared file input, size constant and text normaliser. Note: uploaded JD text round-trips through hidden inputs (acceptable for a local single-user tool). `serverExternalPackages` lists unpdf and mammoth.
