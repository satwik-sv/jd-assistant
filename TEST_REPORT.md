# Final review — 3 October 2026

## Assignment coverage

| Requirement | Implementation and evidence |
|---|---|
| React or Angular | React frontend; production build passes |
| Paste JD once | Active posting retained for both features; changing it clears prior results |
| Free-text grounded Q&A | Real Gemini API; exact numbered quote validation |
| Missing information wording | Canonical “Not stated in this posting.”; live absent-fact and compound-question checks pass |
| Interview questions with reasons | Technical, behavioral and role-specific grouping when supported; every item cites the JD |
| Shared grounding engine | server/grounding.js provides the same normalization, prompt structure and evidence checks |
| Optional resume weak spots | Up to three gaps; JD citations and resume evidence for partial matches; live missing and fully matched resume checks pass |
| File import enhancement | PDF, DOCX, DOC and TXT readers; review-before-apply editor |
| README | Setup, assumptions, tradeoffs, limitations, AI usage and submission instructions provided |
| Repository or deployed link | Candidate must create/share the repository or deploy before submission |
| 2–4 minute recording | Candidate must record and share; WALKTHROUGH.md provides the script |

## Executed validation

- 22/22 automated tests passed: document normalization, exact citations, malformed output, provider errors, request construction, text/DOCX imports, invalid-file handling, and resume evidence validation.
- 21/21 running-server and real Gemini checks passed: HTTP boundaries, cited answers, absent salary/technology, explicit unavailable sponsorship, compound abstention, injection attempts, changed JD, multiple prep categories and a nontechnical posting. Raw synthetic results: TEST_RESULTS.json.
- 10/10 additional live checks passed: TXT, DOCX and text-based PDF extraction; blank PDF, corrupt DOC, unsupported and oversized file rejection; missing resume; weak spots; fully matched resume. Raw results: OPTIONAL_TEST_RESULTS.json.
- Production build passed. Earlier dependency audit reported zero vulnerabilities; this is not a security audit.
- Copy prep text exposes questions, reasons and citations in a selectable text field. Responsive checks at 390 × 844 and 1440 × 1000 showed no horizontal overflow.
- Browser checks: empty posting validation, seven different samples and cycle, grouped source headings, Q&A and missing-fact answers, repeated-question cache, tab result retention, prep generation, citation highlighting, edit/cancel restoration. Updated browser import checks passed for PDF JD, DOCX JD and TXT resume; resume comparison showed Python/PostgreSQL gaps with JD citations and a numbered resume source.

## Limits

Tests cover representative cases, not every possible document or AI response. Exact-quote checks do not prove semantic entailment. Live Gemini results can change with model behavior and quotas. OpenAI transport is tested with mocks; a paid live OpenAI run was not performed. Legacy DOC corrupt-file handling was checked; extraction from a valid legacy DOC fixture has not yet been verified. Scanned PDFs need OCR, and complex tables/columns may affect extraction order. Review imported text before applying.

No sensitive resume was used in evaluation. The submission archive excludes .env, node_modules and generated build files. Reviewers configure their own provider key.
