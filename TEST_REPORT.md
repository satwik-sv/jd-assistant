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
| README | Setup, assumptions, tradeoffs, limitations and AI usage provided |

## Resume visibility fix — 3 October 2026

- Applying a sample posting keeps a visible Resume attached card and a dedicated Resume check tab. Two real Gemini comparisons completed successfully with validated JD and resume citations.
- Browser checks passed: retained resume source, edit disclosure opens with saved text, cancelling preserves source/results, removing a resume clears stale results, tab switching preserves comparison, card and prep shortcuts, and keyboard navigation wraps across three tabs.
- At a 390-pixel viewport, all three tabs fit with no horizontal page overflow. Production build and all 26 automated tests passed.

## Sample resume profiles — 4 October 2026

- Added 24 fictional resume profiles across eight sample JDs: strong, partial and career change. Strong resumes include concrete role-relevant projects, tools and achievements; samples never claim to be real candidate credentials. Removed the prior explicit preparation-hint line.
- All 28 automated tests passed, including profile evidence differentiation and comparison prompt checks. Production build passed.
- Live frontend-role testing initially exposed false gaps for on-site attendance and for 1 year against a 0–2 year requirement. Updated comparison instructions exclude employment logistics and accept experience within a stated range. The targeted strong-profile retry then returned no clear evidence gaps. The partial profile returned cited gaps for testing, browser compatibility and accessibility. Career change returned different cited gaps for React, API integration and Figma-to-component work. The custom-JD guard also passed: sample loading disables when the built-in posting is edited. Results are recorded in RESUME_PROFILE_TEST_RESULTS.json. These checks are examples, not a guarantee of every AI response.

## Resume card and rotation update — 4 October 2026

- Profile cards use native labeled radio inputs, visible selection and keyboard navigation. Added three rotating examples per role/profile (72 total), with per-profile counters and explicit wrap messaging. Partial and career-change histories add different evidence as well as changing context; strong profiles retain core role skills.
- All 29 automated tests passed, including unique pools, consecutive rotation, wrap and invalid selection. Build passed. Browser checks passed for three distinct consecutive loads, returning to the first after three, profile selection by keyboard, and no horizontal overflow at 390 pixels. Existing live reports cover earlier samples; all 72 rotated examples have not been evaluated with the model.

## Source layout update — 5 October 2026

- Added a highlighted Job title label, Department and Employment type metadata, explicit standalone section grouping, and optional source line numbering. Every original source line retains an anchor, including headings.
- All 31 automated tests and the production build passed. New tests verify that overview text and responsibility points stay under their explicit headings, repeated headings remain separate, and every original line is represented once. Browser checks verified a 12-line posting, overview line 6 under heading line 5, and hide/show numbering with all 12 source anchors intact. A real Gemini job-title answer passed validation; clicking its citation highlighted original source line 1 while numbers were hidden.

## Separate sample controls — 5 October 2026

- Load sample JD updates only the JD. Load sample resume updates only the resume and uses the selected profile for a recognized built-in posting. Resume examples still rotate per role/profile.
- Browser checks passed: a custom draft resume remains unchanged after JD loading; the JD remains identical after resume loading. The original draft documents were restored after checking. Production build passed.

## Custom-JD resume samples — 5 October 2026

- Pasted and imported JDs can create a related fictional sample resume via /api/resume with the selected match profile. The server validates its text length and JD inspiration citations and prepends a mandatory fictional label. Generation consumes provider quota; built-in sample loading stays local. Users may instead paste or upload any resume before applying and comparing.
- All 33 automated tests and the production build passed. Eight paced live Gemini checks passed: invalid profile and short JD rejection, custom frontend generation and comparison, different backend generation and partial comparison, an unrelated pasted resume with evidence gaps, and a matched pasted resume with no clear gaps. Results: CUSTOM_RESUME_TEST_RESULTS.json. The generated strong frontend example still produced two gaps, so profile labels are generation targets rather than guaranteed comparison outcomes. Browser checks also passed for generating twice from the same custom backend JD (different histories), readable section breaks, replacing the result with a retail resume, and returning three cited backend gaps. Original draft inputs were restored after testing. A variation identifier requests fresh work histories, but diversity and semantic judgments remain probabilistic.

## Executed validation

- 26/26 automated tests passed: document normalization, exact citations, malformed output, provider errors, request construction, text/DOCX imports, invalid-file handling, resume evidence validation, paired sample coverage and shared adaptive prep policy.
- 21/21 running-server and real Gemini checks passed: HTTP boundaries, cited answers, absent salary/technology, explicit unavailable sponsorship, compound abstention, injection attempts, changed JD, multiple prep categories and a nontechnical posting. Raw synthetic results: TEST_RESULTS.json.
- 10/10 additional live checks passed: TXT, DOCX and text-based PDF extraction; blank PDF, corrupt DOC, unsupported and oversized file rejection; missing resume; weak spots; fully matched resume. Raw results: OPTIONAL_TEST_RESULTS.json.
- Expanded evaluation: 24/25 checks passed across eight fictional, realistic JD/resume pairs and a medium posting. One data-analyst prep response was rejected for an invalid citation; a targeted retry passed, recorded separately rather than changing the original result. Short/medium/long sets produced the appropriate bounded question counts. Raw results: SAMPLE_TEST_RESULTS.json.
- 6/6 export endpoint checks passed: exact text and Unicode preservation, attachment filename/content type, no-store, and empty, missing, duplicate, excessive and cross-origin inputs. Raw results: DOWNLOAD_TEST_RESULTS.json.
- Valid legacy DOC extraction also passed using the library maintainers' public test fixture: https://github.com/morungos/node-word-extractor/blob/develop/__tests__/data/test01.doc (fixture is used locally and is not redistributed here).
- Production build passed. Earlier dependency audit reported zero vulnerabilities; this is not a security audit.
- Copy prep text exposes questions, reasons and citations in a selectable text field. Responsive checks at 390 × 844 and 1440 × 1000 showed no horizontal overflow.
- Browser checks: empty posting validation, seven different samples and cycle, grouped source headings, Q&A and missing-fact answers, repeated-question cache, tab result retention, prep generation, citation highlighting, edit/cancel restoration. Updated browser import checks passed for PDF JD, DOCX JD and TXT resume; resume comparison showed Python/PostgreSQL gaps with JD citations and a numbered resume source.

## Limits

Tests cover representative cases, not every possible document or AI response. Exact-quote checks do not prove semantic entailment. Live Gemini results can change with model behavior and quotas. An initial burst of parallel evaluations hit provider quota; the core and sample checks were rerun with paced requests. One model citation was rejected even on the paced run; the validator's safe rejection is intended but the model-quality check remains marked failed. OpenAI transport is tested with mocks; a paid live OpenAI run was not performed. Scanned PDFs need OCR, and complex tables/columns may affect extraction order. Review imported text before applying. Browser save-to-disk verification was blocked because download permission was declined; the endpoint response and export content were verified before that browser attempt.

## Dataset provenance

All resumes and sample employers are fictional, with intentional evidence gaps. This is not evaluation against real applicants' private resumes. The expanded SRE example uses independently written role patterns informed by the public [GitLab SRE role](https://handbook.gitlab.com/job-description-library/engineering/infrastructure/site-reliability-engineer/). For future role coverage, useful public references include [backend engineering](https://handbook.gitlab.com/job-description-library/engineering/development/backend/) and [product design](https://handbook.gitlab.com/job-description-library/product/product-designer/). Samples are editable input; AI results still come from the real provider.

No sensitive resume was used in evaluation. The submission archive excludes .env, node_modules and generated build files. Reviewers configure their own provider key.
