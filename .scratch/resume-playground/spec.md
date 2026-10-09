# Spec: Decision API Resume Playground

Status: ready-for-agent

Source plan: `docs/PLAN.md` (grilling session, 2026-10-09)

## Problem Statement

OpenAI released the Decisions API (public beta, 6 Oct 2026): a new kind of endpoint that does not generate
text, but answers developer-defined typed questions with calibrated probabilities. Developers at the company
have never used a "decision model" and have no hands-on way to understand what it returns, how to shape
questions for it, how far to trust its confidence, or how it differs from prompting a chat model and parsing
the reply.

Reading the docs does not build intuition. Developers need a realistic, runnable example on their own
machine where they can feed in real-looking input, see the exact request and raw response, and measure how
often the answers are right.

## Solution

A local-only Next.js playground that uses one realistic job — scoring a resume against a job description —
to teach the Decisions API end to end.

A developer pastes or uploads a job description. A generative model drafts a rubric from it: a handful of
scored dimensions, must-have statements, red-flag statements, and an overall-fit verdict. The developer
edits the rubric in a form. They then upload one resume at a time; the app makes a single Decisions API call
and shows a scorecard of probabilities — per-level bars for each dimension, true/false probabilities for
must-haves and red flags, and the overall fit with per-option probabilities and confidence. A dev panel
beside the scorecard exposes the exact request, the raw response, latency, token usage, dollar cost, and
copy-as-curl / copy-as-TypeScript snippets.

A command-line eval runs the same scoring over a labelled synthetic resume set for two different roles and
reports accuracy and calibration, so developers learn that confidence is not accuracy.

The app never deploys, has no login, stores everything as JSON files on disk, and frames every result as a
suggestion that a human decides on.

## User Stories

### Setup and onboarding

1. As a developer, I want to clone the repo and run it with one install command and one dev command, so that I can start playing within minutes.
2. As a developer, I want a single example env file listing every setting, so that I know exactly what to configure.
3. As a developer, I want a clear setup screen when my OpenAI key is missing, so that I am not confronted with a stack trace.
4. As a developer, I want the rubric model and the decision model to be configurable via env, so that I can try other models without code changes.
5. As a developer, I want the low-confidence threshold configurable via env, so that I can see how the threshold changes what gets flagged.
6. As a developer, I want the README to explain what the Decisions API is and how a rubric maps onto its three question types, so that I understand the concept before I click anything.
7. As a developer, I want the README to warn me to use test or synthetic resumes only, so that I do not send real candidate data to a third party.
8. As a developer, I want a short cheatsheet of the Decisions API request and response shapes, so that I can use it in my own projects afterwards.

### Roles and job descriptions

9. As a developer, I want to see a list of the roles I have created, with their current rubric version and number of scored resumes, so that I can pick up where I left off.
10. As a developer, I want a helpful empty state when no roles exist, so that I know the first step is adding a job description.
11. As a developer, I want to create a role by giving it a title and pasting job description text, so that I can use JDs that live in chat or documents.
12. As a developer, I want to create a role by uploading a JD as a PDF or DOCX, so that I can use JDs I already have as files.
13. As a developer, I want to see the text extracted from my uploaded JD with a character count, so that I can confirm the model will read what I expect.
14. As a developer, I want image-only (scanned) PDFs to be rejected with a clear message, so that I do not get a silently empty rubric.
15. As a developer, I want legacy .doc files and files over 5 MB rejected with a clear message, so that I know which formats are supported.

### Rubric generation

16. As a developer, I want to generate a rubric from the JD with one click, so that I do not have to write questions from scratch.
17. As a developer, I want the generated rubric to contain 3–8 dimensions, up to 8 must-haves, up to 6 red flags, and one overall-fit question, so that it maps cleanly to a single Decisions request.
18. As a developer, I want every dimension to use the same five level labels (None, Basic, Working, Strong, Expert) with descriptions written for that dimension, so that scores are comparable across dimensions yet specific to the role.
19. As a developer, I want the rubric generator to produce a short role summary, so that the overall-fit question has role context without sending the whole JD.
20. As a developer, I want must-haves and red flags phrased as atomic statements that can be checked against a resume, so that each predicate answer is meaningful on its own.
21. As a developer, I want the generator guided by a worked example rubric, so that generated rubrics follow a consistent standard.
22. As a developer, I want the generator to avoid criteria based on protected attributes (age, gender, nationality, college prestige), so that the demo models responsible practice.
23. As a developer, I want generation to return schema-valid output or a clear error, so that I never land in an editor with a broken rubric.
24. As a developer, I want to see a progress state while the rubric is being drafted, so that I know the app is working.

### Rubric editing and versioning

25. As a developer, I want to edit the rubric in a form, so that I can tune questions without touching JSON.
26. As a developer, I want to add, remove, and reorder dimensions, so that the rubric matches what I actually care about.
27. As a developer, I want to edit each dimension's name, instructions, and the five level descriptions, so that I can sharpen how the model judges each level.
28. As a developer, I want to add, edit, and remove must-haves and red flags, so that I control the predicate questions.
29. As a developer, I want to edit the role summary and the three overall-fit option descriptions, so that I can steer the final verdict.
30. As a developer, I want saving an edit to create a new rubric version and leave earlier versions untouched, so that past results remain explainable.
31. As a developer, I want each rubric version marked as generated or edited, so that I can tell model output from my changes.
32. As a developer, I want form validation that mirrors the rubric schema limits, so that I cannot save a rubric the API call would reject.

### Scoring a resume

33. As a developer, I want to upload one resume (text-based PDF or DOCX) against a role, so that I can see how the Decisions API judges it.
34. As a developer, I want each resume scored with exactly one Decisions API call containing every rubric question, so that latency and cost numbers reflect a real single decision.
35. As a developer, I want the resume sent as evidence only, with every question instructing the model to treat it as evidence and not instructions, so that a resume cannot steer its own score.
36. As a developer, I want missing information treated as absent, so that resumes are not rewarded for what they do not say.
37. As a developer, I want scanned resumes rejected before any API call, so that I am never charged for scoring blank text.
38. As a developer, I want API errors captured on the run and shown in the UI, so that a failed call is visible rather than crashing the page.
39. As a developer, I want every scored resume to appear in the role's history with its fit, confidence, rubric version, and time, so that I can compare resumes.
40. As a developer, I want runs scored on an older rubric version marked as such, so that I know their scores may not reflect my current rubric.
41. As a developer, I want a re-score action on stale runs that reuses the stored resume text against the current rubric, so that I can compare the effect of rubric edits.

### Scorecard

42. As a developer, I want to see the overall fit with probabilities for strong, possible, and weak fit and the model's confidence, so that I see the full distribution, not just the winner.
43. As a developer, I want each dimension shown with a probability bar per level and its fractional score, so that I understand that a score of 2.4 is a weighted average, not a level.
44. As a developer, I want each must-have and red flag shown with its probability and a tick or cross at 0.5, so that I can read the scorecard as reasons.
45. As a developer, I want a low-confidence badge on any answer below the threshold, so that I learn where not to trust the model.
46. As a developer, I want a refused question shown as "declined" with no score, while the other answers still display, so that I understand refusals are per question.
47. As a developer, I want a persistent "suggestion only — a human decides" note on the scorecard, so that the demo never implies automated hiring.
48. As a developer, I want the scorecard to work in light and dark themes and at phone width, so that it is comfortable to use anywhere.

### Dev panel

49. As a developer, I want to see the exact request body that was sent, so that I can learn how questions are shaped.
50. As a developer, I want to see the raw response object, so that I can learn the answer types including refusals.
51. As a developer, I want to see latency, input/output/total tokens, and dollar cost for the call, so that I understand the speed and price profile.
52. As a developer, I want to copy the request as a curl command, so that I can reproduce it in a terminal.
53. As a developer, I want to copy the request as a TypeScript SDK snippet, so that I can drop it into my own project.
54. As a developer, I want copied snippets to reference my key as an environment variable rather than inline it, so that I never paste a secret by accident.
55. As a developer, I want to see the extracted resume text that the model actually read, so that I can spot extraction problems.

### Eval

56. As a developer, I want a single command that scores a labelled synthetic resume set, so that I can measure accuracy instead of trusting confidence.
57. As a developer, I want synthetic fixtures for two different roles (AI engineer and senior React developer), so that I can see the JD-first design generalise.
58. As a developer, I want each fixture to use a frozen rubric, so that eval results are reproducible run to run.
59. As a developer, I want each fixture to include clear fits, clear misses, borderline cases, keyword-stuffed resumes, an adjacent role, and a prompt-injection attempt, so that the eval probes the interesting failure modes.
60. As a developer, I want labels for expected overall fit and expected must-have truth values, so that the eval has ground truth without per-dimension labelling.
61. As a developer, I want the report to show overall-fit accuracy with a confusion matrix, so that I see which verdicts get confused.
62. As a developer, I want must-have accuracy at the 0.5 threshold, so that I see how reliable predicates are.
63. As a developer, I want Brier scores, a reliability table of confidence versus accuracy, and expected calibration error, so that I learn whether the model's confidence means anything.
64. As a developer, I want the most confident wrong answers listed, so that I can inspect the worst misses.
65. As the playground owner, I want an optional private eval mode that reads fixtures from a directory outside the repo, so that I can check the app against real data without committing it.
66. As a developer, I want the private mode to fail with a clear message when its directory is not configured, so that I am not confused by an empty report.

### Owner

67. As the playground owner, I want everything stored as readable JSON files in a gitignored folder, so that I can inspect and diff state with no database.
68. As the playground owner, I want each phase of the build to end in something I can test by hand, so that I can verify before moving on.

## Implementation Decisions

### Modules

- **Config** — parses and validates environment settings at boot: OpenAI key (required unless mock mode), mock mode flag (`OPENAI_MOCK=1`: canned, input-dependent responses so the UI runs without a key; a banner says so), rubric model (default `gpt-6.1-sol`), decision model (default `gpt-6-luna`), low-confidence threshold (default 0.6), data directory (default `./data`), optional private eval directory, live-test flag. A missing key produces a typed error the UI renders as a setup screen.
- **Schemas** — zod schemas for Rubric, Role, and Run, shared by the generator, the store, the editor validation, and the service.
- **Store** — file-backed persistence under the data directory. Interface: list/get/save role, save rubric version, get rubric (latest or by version), save/get/list runs, save/get stored resume text. Writes are atomic (temp file then rename). Rubric versions are immutable once written.
- **Extractor** — turns an uploaded file into plain text. PDF via `unpdf`, DOCX via `mammoth`. Rejects image-only PDFs (trimmed text under 200 characters or under 40 characters per page), legacy `.doc`, unsupported types, and files over 5 MB, each with a distinct, user-presentable error.
- **OpenAI gateway (the single test seam)** — the only module that talks to OpenAI. Two methods: draft a rubric from JD text (Responses API with structured outputs against the Rubric schema, few-shot with the example rubric), and send a decisions request returning the raw Decision object. Injected into the service; replaced by a fake in tests.
- **Question builder** — pure mapping from a Rubric to a Decisions `questions` array. Dimensions become `score` questions with the five fixed levels; must-haves and red flags become `predicate` questions; overall fit becomes a `choice` question with string values `strong_fit` / `possible_fit` / `weak_fit` and the role summary injected into its instructions. Names are namespaced (`dim.<key>`, `must.<key>`, `flag.<key>`, `fit`) and every question carries the shared evidence guard.
- **Scorecard parser** — pure mapping from a Rubric plus raw Decision response to a Scorecard view model, matched by question name (not position). Handles refusals per question, marks answers below the low-confidence threshold, applies the 0.5 tick/cross cut for predicates. Predicates get no confidence from the API, so their confidence is taken as max(p, 1 − p) — near-even predicates get the low-confidence badge. An answer absent from the response is reported as missing (distinct from a refusal).
- **Cost** — computes dollar cost from input tokens at $0.10 per million; output tokens free.
- **Snippets** — builds curl and TypeScript SDK snippets from a stored request, always referencing the key via environment variable.
- **Role service (the tested surface)** — orchestrates the above. Operations: create role (from pasted text or uploaded file), generate rubric (writes version 1 or the next version, marked generated), save rubric (writes the next version, marked edited), score resume (extract, build questions, call gateway, time it, compute cost, persist run and resume text; on API failure persist the run with an error), re-score run (reuse stored resume text against the current rubric, creating a new run). Server Actions are thin wrappers that call this service.
- **Eval runner + metrics** — CLI entry point that loads fixtures (or the private directory), scores each resume via the service's scoring path with the fixture's frozen rubric, and writes a Markdown report plus a JSON results file. Metrics are pure functions.

### Data model

- **Rubric**: version (positive integer), created-at, source (generated | edited), role summary, dimensions (3–8; each with key, name, instructions, and exactly five levels whose labels are fixed in order None/Basic/Working/Strong/Expert with per-dimension descriptions), must-haves (≤ 8 key + statement), red flags (≤ 6 key + statement), fit (instructions + exactly three options with fixed values and descriptions). Keys are lowercase snake case.
- **Role**: id, title, created-at, JD source (paste | pdf | docx), current rubric version (nullable until generated). JD text stored alongside.
- **Run**: id, role id, rubric version used, created-at, resume metadata (file name, kind, character count), exact request sent, raw response (nullable on error), latency in ms, cost in USD, error message (nullable). Resume text stored alongside.
- On-disk layout: one directory per role containing the role record, the JD text, a rubric-versions directory, and a runs directory.

### API contract (Decisions API, verified against `openai` v7.30.0)

- Call via `client.decisions.create` with model, `input` (resume text prefixed with a `RESUME:` marker), and the questions array. Requires `openai` ≥ 7.30.0.
- Answers: predicate → probability; choice → chosen value, confidence, per-option probabilities; score → probability-weighted score over 0-indexed levels (can be fractional), confidence, per-level probabilities; any single answer may be a refusal with no reason.
- Inputs are text or base64 images only — PDFs are never sent; extraction is always server-side.
- Total questions per request are capped at 23 by the rubric schema because the API publishes no limit.

### Architecture and interactions

- All OpenAI calls run server-side; the key never reaches the browser. Mutations use Server Actions (which accept FormData, so no upload route handler is needed). Extraction runs in the Node runtime.
- Routes: roles list; new role (JD input + generate); rubric editor; role page (resume upload + history); run page (scorecard + dev panel).
- Overall fit is decided solely by the Decisions `choice` answer — there is no computed or weighted score.
- One resume per scoring action; no batch upload.
- Visual direction: light and dark following the system preference, Apple-style restraint, neutral greys with a single blue accent, system/Inter type. UI phases load the `apple-design` and `design-taste-frontend` skills.
- Rubric model default is the balanced tier (`gpt-6.1-sol`). Before building generation, confirm it supports Structured Outputs with the Rubric schema; if constraints such as exact array lengths are rejected, send a relaxed schema and enforce the full schema after parsing, with one retry on failure.

### Stack

Next.js 16 App Router, TypeScript, Tailwind, shadcn/ui, pnpm, zod, Vitest, `openai` ≥ 7.30.0, `unpdf`, `mammoth`.

## Testing Decisions

### What makes a good test here

- Tests assert externally observable behaviour: what is written to the data directory, what the service returns, what the scorecard view model contains, what the extractor accepts or rejects. They do not assert internal call order, private helpers, or how a module is structured.
- **One seam only: the OpenAI gateway.** Every test above that seam uses real modules — real store against a temporary data directory, real extractor against real fixture files, real question builder and parser. The fake gateway returns canned rubrics and canned Decision responses (including refusals, fractional scores, low confidence, and API errors).
- Tests run at the highest level available: the **role service** is the primary surface. Server Actions and React components are not unit-tested; they are verified by each phase's manual check.

### Modules under test

- **Role service (primary)** — create role from paste and from file; generate rubric writes version 1 marked generated; save rubric writes the next version and leaves the prior file byte-identical; score resume persists a run with request, response, latency, cost, and rubric version; an API failure persists a run with an error and no response; re-score uses stored resume text against the current rubric and creates a new run; runs on older versions are reported as stale.
- **Extractor (no seam)** — a text PDF, a DOCX, an image-only PDF (rejected), a `.doc` (rejected), an oversized file (rejected).
- **Question builder and scorecard parser (pure)** — namespaced names, evidence guard present on every question, fixed level labels, role summary injected into fit; parser maps by name regardless of order, handles a refusal among normal answers, preserves fractional scores, flags low confidence at the configured threshold.
- **Snippets (pure)** — curl and TS output reference the key via environment variable and round-trip the request body.
- **Eval metrics (pure)** — accuracy, confusion matrix, binary and multi-class Brier, reliability bins, ECE, confident-miss ranking against hand-computed small cases.
- **Live smoke test** — runs only when the live flag is set; uses the real gateway with a maximum-size rubric (23 questions) to confirm the request is accepted and every answer type parses.

### Prior art

The repo is new; there are no existing tests. Patterns are set in the first phase: Vitest, a temporary-directory helper for the store, and a fake gateway factory shared across service tests.

## Out of Scope

- Batch upload of multiple resumes and a ranked comparison table.
- A computed or weighted overall score, dimension weights, or pass thresholds.
- PII redaction of any kind (demo only; the README warns to use test resumes).
- Image-only PDF support via page rendering, and legacy `.doc` support.
- Employment-gap detection or any date arithmetic over work history.
- Evidence quotes or generated explanations for scores.
- Authentication, multi-user support, a database, and any deployment.
- Using the app for real hiring decisions.
- Per-dimension labels in the eval set.

## Further Notes

- The Decisions API is in public beta; its response shape may change. Only the gateway and the scorecard parser read the raw shape, so a change is contained to those two modules.
- OpenAI's guidance is that confidence is not accuracy and a decision is not an authorization boundary. The scorecard banner, low-confidence badge, and calibration report exist to teach exactly that.
- OpenAI's usage policies likely restrict automated employment decisions without human review; the human-in-the-loop framing in the UI and README is deliberate.
- The synthetic eval resumes are written by a model during the build and labelled by the owner before being committed; all names, companies, and contact details are fictional.
- The frozen eval rubrics are produced once through the app's own generator, reviewed, and committed — they double as regression fixtures for the generator.
- The owner builds solo with Claude Code; the source plan's seven phases (scaffold, ingest, rubric, scoring, scorecard + dev panel, eval, README + polish) are the natural ticket boundaries.
