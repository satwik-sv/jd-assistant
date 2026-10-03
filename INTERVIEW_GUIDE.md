# Understand and defend the project

Monday October 5, 2026 is the interview date shared in this chat. Use the time before then to run, navigate and modify the project yourself. This guide describes the implementation; phrase personal explanations around choices you have reviewed and can defend.

## The explanation in one minute

The browser holds one active posting. A shared server function turns it into numbered nonempty lines. Each question or prep request sends that source document to an LLM with rules about evidence and abstention. The model returns schema-constrained JSON. The server checks each citation against the document, normalizes absent answers, and then sends validated output back to React. Clicking evidence highlights the line. Editing and applying a posting resets old results.

## File map

| File | Responsibility | What to point out in a review |
| --- | --- | --- |
| src/main.jsx | React UI, active posting, questions, history, tabs, source highlights | State updates, reset behavior, disabled controls, AbortController, accessible tabs |
| src/style.css | Layout, typography, responsive behavior, focus and reduced motion | Two-pane desktop workspace becomes one column on mobile |
| server/index.js | HTTP boundary, validation, key access, concurrency, static serving | No secret is sent to the browser; server routes and provider errors |
| server/grounding.js | Canonical source, schemas, prompt, API call, citation checks | The same pipeline serves Q&A and prep |
| tests/grounding.test.js | Deterministic behavior and mocked provider contract | Invalid quotes rejected; missing answers normalized; mocks do not test reasoning |
| .env.example | Documented configuration without secrets | AI_PROVIDER, GEMINI_API_KEY/GEMINI_MODEL, OPENAI_API_KEY/OPENAI_MODEL |

## Questions they may ask

**What did you build?** A source-cited Q&A and focused interview-prep app. Both features read the same posting through one grounding module.

**Why React?** It offers straightforward stateful forms, result rendering and component interaction. This project does not need a large framework or client router.

**Why a backend?** To keep API credentials out of the frontend, enforce limits, control prompts and validate results before they reach the user.

**What does grounding mean here?** Restricting factual answers to the posting and attaching evidence the user can inspect. It is not model training and it is not a guarantee of truth.

**Is this RAG?** It supplies the full source in context; there is no embedding index or retrieval stage. Describe it as full-context document grounding. Adding vector search just to use the term RAG would add complexity without an established need.

**Why not chunk and retrieve?** Typical postings are short. Retrieval could miss a relevant line, especially when deciding absence. The full document plus a size limit is the simpler starting point. For many long documents, retrieval and document-wide absence checks would be worth designing.

**How are the two features connected?** Both routes call readDocument and generate, with the same system instructions, source representation and validateCitations. Only their task schema differs. The engine is shared; separate API actions keep the UI simple.

**Why not analyze the posting once with the model?** “Paste once” is achieved in the UI. Each action rereads the same original source to avoid relying on a lossy generated summary. Cached analysis could reduce repeated token cost, but it introduces cache invalidation and potentially omits important facts.

**How does not-stated work?** The model decides whether the posting supports the requested fact. If it returns not_stated, the server replaces its wording with one fixed message and removes citations. The model can still misclassify a question; testing the decision is separate from testing the fixed wording.

**Why distinguish inference?** A seniority estimate based on years is different from an explicit title. If the model makes a supported estimate, the UI labels it and suggests verification. Missing facts such as sponsorship cannot be filled by inference.

**Do schemas eliminate hallucination?** No. They enforce the JSON structure. Exact quote validation catches nonexistent evidence but not every incorrect conclusion. A real quote on the right line can still be irrelevant.

**What prevents prompt injection?** The system prompt says user content is untrusted, and the source/question are serialized as data. No tools, browser access or arbitrary execution are available to the model. These defenses lower risk; embedded instructions could still influence reasoning. Include adversarial evaluation and avoid claiming perfect protection.

**Why exact substrings instead of fuzzy citations?** They are simple to audit and prevent manufactured evidence from passing due to approximate matching. A model formatting change can cause a false rejection; that is preferable to showing an unverifiable citation. Retry with a clear error.

**Why show complete results instead of streaming?** Output is structured JSON and must pass evidence validation before it is displayed. Streaming partial answers could show claims before their citations are checked.

**How do you handle errors?** Missing key, invalid input, provider rejection, quota, timeout, refusal, incomplete response and invalid citations produce visible messages. Buttons reflect loading and avoid duplicate UI requests. Successful history remains available after a failed new request.

**What about privacy?** Posting and history live in browser memory, not persistent storage. Requests send the posting to the selected provider. OpenAI uses store:false; Gemini follows Google's processing and free-tier policies. Neither configuration implies zero provider retention. No API key belongs in the browser, logs, recordings or repository.

**What is the security limitation?** The prototype is local and has no user authentication. A concurrency cap and browser origin check do not prevent a direct client from abusing an exposed API. Add authentication, user-level quotas, a reverse proxy and deployment controls before public exposure.

**How would you measure success?** Use a labeled set: explicit facts, absent facts, negation, contradictory passages, inferred seniority, compound questions and injections. Score factual correctness, evidence relevance, citation validity and abstention precision/recall. Separately judge prep specificity and usefulness. Manual examples alone are not a rigorous benchmark.

**What is tested?** There are 22 deterministic tests for normalization, citations, provider contracts/errors, imports and resume validation. Separate running-server suites passed 21 required-feature checks and 10 optional-feature checks, including real Gemini calls with synthetic documents. See TEST_REPORT.md and the two JSON result files. These are representative evaluations, not proof that every model response will be correct.

**How does file import work?** The browser sends the file as bytes to /api/import. The server uses pdf-parse, mammoth, word-extractor or UTF-8 decoding by extension, rejects invalid or excessive documents, and returns text for review. It does not save the file. Applying that text uses the same numbered grounding pipeline as paste. A scanned PDF needs OCR, and complex layout can alter reading order.

**How does resume comparison work?** /api/gaps numbers the resume separately and sends it with the JD using the shared engine. The result contains at most three important requirements not clearly demonstrated. Each item needs exact JD evidence; partial matches need exact resume evidence. Missing evidence has no invented resume citation. This helps the candidate prepare; it does not make a hiring decision or assert that they lack a skill.

**What would you refactor?** Split the large React component into PostingPanel, QuestionPanel, PrepPanel and Citation components when the interface grows; keep server grounding centralized. For this scope the server already separates HTTP and model logic.

**How was AI used?** Codex generated implementation and documentation. Explain which parts you reviewed, what you tested, and what you changed. Be direct about AI assistance; the assignment allows it and evaluates understanding.

## Trace a request during code review

1. Form submission calls run('ask') in src/main.jsx.
2. React sends JSON {jd, question} to /api/ask.
3. server/index.js checks the task, configuration, origin and concurrency; validates the posting and question.
4. readDocument creates lines. generate constructs the provider request with the appropriate schema.
5. Provider response is checked for successful completion. Output text is parsed as JSON.
6. validateResult normalizes abstention or checks citations using validateCitations.
7. React appends the result to history and renders the answer with clickable evidence.

## Live-change practice

Do these yourself in a practice copy, then undo if unnecessary:

- Change the interview question budget from six to three. Find the prompt in generate; discuss whether the server maximum should also change.
- Add a suggested question chip. Edit the suggestions array in src/main.jsx; no backend change is required.
- Add a new category. Update the schema enum, validator enum, UI category list and tests together. This demonstrates why duplicated enums might become a shared constant later.
- Change the posting size limit. Update server validation, textarea limit, displayed counter and tests. Explain why server limits are authoritative.
- Add a test rejecting a whitespace-only citation. This already fails the existing validator; write the test and explain the branch.
- Debug a citation with the wrong line number. It should be rejected; inspect the canonical line numbering rather than weakening validation.
- Explain why a compound missing-fact question abstains and how a per-claim answer schema would improve that behavior.

## Submission and preparation checklist

Saturday: configure your key locally, run automated checks, complete EVALUATION.md against the real provider, review the code, publish the repository without secrets, record the walkthrough, and verify reviewer access. The document requests October 3; confirm the company’s EOD timezone.

Sunday: follow the request trace without reading notes; practice two small edits; explain the grounding limitation in your own words; watch your recording and remove any inaccurate claims.

Monday: open the project, keep a working sample ready, know where the prompt/schema/validation live, and be prepared to debug unfamiliar questions. When a result is wrong, inspect source evidence and state the limitation clearly rather than defending it automatically.
