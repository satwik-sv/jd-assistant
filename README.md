# JD Assistant

A React app for candidates to understand a job description and prepare for an interview. Paste one posting, ask free-text questions with exact source citations, and generate a focused practice set grouped by technical, behavioral and role-specific topics.

## Run locally

Requires Node.js 20.19+ (or 22.12+).

```powershell
npm install
Copy-Item .env.example .env
# Edit .env and set GEMINI_API_KEY to your own key and AI_PROVIDER=gemini.
npm run dev
```

Open http://localhost:3000. The dev command builds and serves the app; it does not hot-reload. After frontend changes, rebuild and refresh the browser; after server or .env changes, restart. This avoids dependency-optimizer permission issues in the supplied Windows workspace. Gemini defaults to gemini-3.1-flash-lite (GEMINI_MODEL); OpenAI defaults to gpt-4.1-mini (OPENAI_MODEL). Set AI_PROVIDER=gemini or openai explicitly. Never put an API key in a VITE_ variable or commit .env. On Windows, START_APP.cmd offers the same build-and-start flow; keep its terminal open while using the local app.

```powershell
npm test
npm run build
npm start
```

The production server serves the built frontend and API on the same port. It binds to loopback by default for local use; if deploying to a container platform, set HOST=0.0.0.0 and protect the endpoint with authentication and rate limits first. The assignment accepts a repository, so public deployment is optional.

## How it works

1. Frontend holds the active posting in session memory. Editing and applying a posting resets previous answers and prep.
2. server/grounding.js normalizes nonempty lines into one numbered source document. Both features use this identical representation.
3. The full numbered document is sent to Gemini or OpenAI according to AI_PROVIDER. Posting and question are serialized as data. System instructions prohibit treating embedded text as instructions or using outside knowledge.
4. Strict JSON schemas constrain answer status, citation structure and question categories. They constrain shape, not factual correctness.
5. Every positive answer and prep item must include citations. The server verifies line numbers and exact quote substrings against the original document before displaying output. A failed check produces a visible error rather than invented evidence.
6. A not_stated response is normalized to exactly “Not stated in this posting.” and has no citations. Explicit facts and inferences have separate labels.

API references: [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output) and [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs). OpenAI requests use store:false. Gemini requests follow Google's provider policies, including free-tier data handling. Use synthetic postings for demonstrations; do not infer that either provider has zero retention. This app has no database and does not log postings. App session data disappears on refresh.

## Product decisions and assumptions

- Short job postings fit in the context window, so full-document grounding is simpler and preserves missing-fact context better than top-k retrieval. There is a 24,000-character limit instead of silent truncation.
- Line citations are numbered nonempty source lines after whitespace normalization, not Word page or physical wrapped-line numbers. The UI displays the same numbering and highlights sources when clicked.
- Interview prep is explicitly labeled as practice suggestions, not actual employer interview questions. Up to six prompts are requested; unsupported categories are omitted instead of filled with generic questions.
- A compound question with any missing requested fact conservatively abstains. A future version could answer each subquestion independently.
- Optional resume comparison lists up to three important requirements not clearly demonstrated by the resume. Each item cites the JD; partial matches also cite exact resume text. Missing evidence is labeled without inventing a resume citation. A fully matched resume can produce no weak spots.
- PDF, DOCX, legacy DOC and UTF-8 TXT imports extract text on the server without saving the file. Review the extracted text before applying. Limits: 5 MB, 24,000 characters and 50 PDF pages. Scanned PDFs require OCR outside this app. Tables, columns and legacy formatting may change reading order; numbered citations refer to extracted text, not original pages.
- Seven fictional sample postings cycle through different roles; they supply editable input and never substitute canned answers for the real API.
- Copy prep text opens a selectable text version of questions, reasons and citations for your practice notes.

## Tradeoffs and limits

Citation existence is checked in code; whether the quote entails the answer is still judged by the LLM. A wrong inference or irrelevant but real quote can pass validation. Prompt injection defenses reduce risk but are not a security guarantee. This is a take-home prototype, not an assurance that every response is correct.

Each action resends the full document. This is simple and stateless but costs more than cached analysis over many questions. The app does not stream because it validates complete structured output before showing it. It has a 45-second provider timeout, three-request concurrency cap, input limits and same-origin browser checks; it does not have user authentication or persistent per-user rate limiting. Same-origin checks are not authentication. Keep it local unless those protections are added.

With more time: build a labeled evaluation set for missing facts, contradictions, vague seniority and injection attempts; measure grounded accuracy and abstention; validate entailment per claim; add user-level throttling/authentication before public deployment; consider long-document retrieval only after a real need arises.

## Validation

`npm test` covers normalization, limits, absent-fact wording, nonexistent evidence, malformed output, source labels, prep evidence, provider request construction and failure/refusal handling. Provider unit tests use a mock transport and do not prove live LLM accuracy. `node tests/live-check.mjs` explicitly runs HTTP boundary checks and real-provider evaluation against the running app using synthetic postings; it writes TEST_RESULTS.json. See TEST_REPORT.md for the final review and EVALUATION.md for the manual checklist. A production build verifies the React bundle. No API key is included in the submission package.

## AI tool usage

Codex was used to read the assignment, create the React/Node implementation, draft prompts, write deterministic tests and prepare documentation. The design favors a small codebase that can be navigated and modified in a live review. The candidate should run the app with their key, inspect the code, complete the live evaluation checklist, and adapt the walkthrough to their actual understanding; do not claim tests or decisions that you have not verified yourself.

## Submission

The brief allows a GitHub repository instead of a deployed link. Create a repository from this folder, including package-lock.json and excluding node_modules, dist and .env. Make sure reviewers have access. Record a 2–4 minute screen walkthrough using WALKTHROUGH.md. Saturday October 3, 2026 is the requested submission date; confirm the company’s EOD timezone.

## Source display and response speed

The source panel adds presentation-only labels based on explicit prefixes and simple keyword rules. Labels are navigation aids, not model-extracted facts; the original text and line numbering remain intact. Repeated questions reuse validated results in browser memory for the current posting (up to 50 entries); changing the posting clears the cache. Interview prep remains visible when switching tabs, while Regenerate deliberately makes a new request. Prompts request concise answers and focused prep. Provider latency still varies, and lower output limits alone do not guarantee faster responses.
