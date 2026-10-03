# A three-minute screen walkthrough

Use this as a sequence of talking points. Record your own explanation after running the app with a real key.

## 0:00–0:30 Problem and scope

“This is JD Assistant. A candidate pastes or imports one job posting, gets answers with source citations, and prepares using questions tied to the role. I also added the optional resume comparison to highlight requirements the resume does not clearly demonstrate. The app uses React and a Node server with a real LLM API call.”

Show the input and load the sample. Apply it. Point out that citations refer to numbered nonempty lines.

## 0:30–1:15 Grounded answers

Ask “Is this role remote?” Show the actual answer and click its citation. Explain that the source says hybrid, which should not become a claim of fully remote work. Ask “Do they mention visa sponsorship?” Show abstention.

“The absence of a statement is not a no. That distinction is part of the prompt, and not-stated results use a fixed server-side message.”

## 1:15–1:50 Interview preparation

Switch to prep and generate questions. Show categories and a reason. Click a citation.

Briefly show the optional resume comparison with a synthetic resume: point out a weak spot, its JD citation, and the distinction between missing resume evidence and missing ability. Show the file-import control if time permits.

“These are practice suggestions, not a prediction of the employer’s actual questions. Both modes use the exact same numbered document and citation validation.”

## 1:50–2:35 Architecture and decisions

Open server/grounding.js. Show readDocument, schemas, generate and validateCitations.

“For short postings I used the full text rather than embeddings. It keeps implementation small and lets the model see the entire posting before deciding something is missing. The key stays on the server. Strict JSON handles output shape; the server checks that every quote appears on its cited line.”

## 2:35–3:00 Limits and next steps

“A valid quote can still support a bad interpretation. I would evaluate missing facts and contradictions on a labeled dataset and add a claim-level entailment check. The project passed deterministic tests and live Gemini examples; neither proves every future answer correct. Before public deployment I would add authentication and user-level rate limits.”

Close with the README and your actual test results. Avoid reading this script word for word or saying a live test passed unless you have run it.
