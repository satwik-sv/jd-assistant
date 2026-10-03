import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { sourceLabel } from "./source-label.js";
const SAMPLE = `Full-Stack AI Engineer · Meridian Labs
Location: Bengaluru, India. Hybrid: three days per week in the office.
We are looking for an engineer with 3+ years of professional software development experience.
Build customer-facing applications using React, TypeScript and Python.
Design and evaluate LLM-powered features, including retrieval-augmented generation and prompt engineering.
Develop REST APIs and work with PostgreSQL and cloud deployment on AWS.
Collaborate with product managers and designers to turn ambiguous needs into reliable features.
Own testing, monitoring and performance improvements across the stack.
Communicate technical tradeoffs clearly and participate in thoughtful code reviews.`;
const SAMPLES = [
  SAMPLE,
  `Junior Frontend Developer · Cedar Digital
Location: Pune, India. On-site, Monday to Friday.
Experience: 0–2 years; recent graduates with a strong portfolio are welcome.
Build accessible, responsive interfaces with React, JavaScript, HTML and CSS.
Translate Figma designs into reusable components and integrate REST APIs.
Write component tests with React Testing Library and fix browser compatibility issues.
Work with senior engineers and designers; explain your implementation choices in code reviews.
Required: Git, CSS layouts and a basic understanding of web accessibility.
This is a full-time position.`,
  `Senior Backend Engineer · Harbor Systems
Location: Remote within India.
Experience: 6+ years of backend development, including ownership of production services.
Design reliable APIs and background jobs with Java, Spring Boot and PostgreSQL.
Improve distributed-system resilience, database performance and observability.
Deploy containerized services on AWS and take part in a shared on-call rotation.
Mentor engineers and lead architectural reviews with clear tradeoff analysis.
Required: automated testing, incident response and experience with message queues.
Visa sponsorship is not available for this role.`,
  `Data Analyst · Orchard Retail
Location: Hyderabad, India. Hybrid, two office days per week.
Experience: 2–4 years working with business data.
Use SQL and Python to investigate sales trends and customer retention.
Build Power BI dashboards and document metric definitions for business teams.
Validate data quality and communicate findings to nontechnical stakeholders.
Partner with marketing and operations to measure campaign outcomes.
Required: Excel, SQL joins, basic statistics and clear written communication.
Annual salary range: INR 8–12 lakh.`,
  `Product Manager · Beacon Health
Location: Mumbai, India. On-site.
Experience: 4+ years managing software products.
Interview customers and translate their needs into clear product requirements.
Prioritize a roadmap for appointment booking and patient communication tools.
Work with design, engineering and compliance teams to deliver releases.
Define success metrics, evaluate experiments and communicate product decisions.
Required: stakeholder management, user research and experience prioritizing competing needs.
Coding experience is helpful but is not required.`,
  `DevOps Engineer · Atlas Cloud
Location: Remote within India. Full-time.
Experience: 3+ years operating cloud infrastructure.
Manage Kubernetes clusters and infrastructure as code with Terraform.
Build CI/CD pipelines and improve deployment reliability on AWS.
Monitor services with Prometheus and Grafana, and participate in incident response.
Collaborate with developers to improve security and reduce operational toil.
Required: Linux, networking, scripting and familiarity with cloud access controls.
Occasional scheduled evening maintenance is required.`,
  `UX Designer · Studio North
Location: Chennai, India. Hybrid, three office days per week.
Experience: 2+ years in digital product design.
Plan user interviews and usability tests for a mobile learning product.
Create wireframes and interactive prototypes in Figma.
Maintain a design system with accessible components and documented patterns.
Work with product managers and developers to balance user needs with delivery constraints.
Required: a portfolio demonstrating research, interaction design and iteration.
This is a six-month contract with a possible extension.`,
];
function App() {
  const [jd, setJd] = useState(""),
    [document, setDocument] = useState(null),
    [editing, setEditing] = useState(true),
    [tab, setTab] = useState("ask"),
    [question, setQuestion] = useState(""),
    [history, setHistory] = useState([]),
    [prep, setPrep] = useState(null),
    [resume, setResume] = useState(""),
    [activeResume, setActiveResume] = useState(""),
    [gaps, setGaps] = useState(null),
    [importNotice, setImportNotice] = useState(""),
    [busy, setBusy] = useState(null),
    [error, setError] = useState(""),
    [configured, setConfigured] = useState(null),
    [highlight, setHighlight] = useState(null);
  const pending = useRef(null);
  const answerCache = useRef(new Map());
  const sampleIndex = useRef(0);
  const lines =
    document
      ?.split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean) || [];
  const sourceGroups = lines.reduce((groups, text, index) => {
    const label = sourceLabel(text, index);
    let group = groups.find((item) => item.label === label);
    if (!group) {
      group = { label, points: [] };
      groups.push(group);
    }
    group.points.push({ text, line: index + 1 });
    return groups;
  }, []);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((x) => setConfigured(x.configured))
      .catch(() =>
        setError("Could not connect to the server. Refresh to try again."),
      );
    return () => pending.current?.abort();
  }, []);
  function commit() {
    if (busy) return;
    if (jd.trim().length < 30) {
      setError("Paste at least 30 characters to start.");
      return;
    }
    if (resume.trim() && resume.trim().length < 30) {
      setError("Paste a resume of at least 30 characters, or leave it empty.");
      return;
    }
    pending.current?.abort();
    setBusy(null);
    setDocument(jd);
    setEditing(false);
    setHistory([]);
    setQuestion("");
    answerCache.current.clear();
    setPrep(null);
    setGaps(null);
    setActiveResume(resume);
      setImportNotice("");
    setHighlight(null);
    setError("");
  }
  async function importFile(event, target) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setError("");
    setImportNotice("");
    if (file.size > 5 * 1024 * 1024) {
      setError("Files must be 5 MB or smaller.");
      return;
    }
    setBusy("import");
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
        },
        body: file,
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not import the file.");
      if (target === "jd") setJd(result.text);
      else setResume(result.text);
      setImportNotice(
        `Imported ${file.name}. Review the extracted text before applying the posting.`,
      );
    } catch (error) {
      setError(
        error.name === "TimeoutError"
          ? "File import took too long. Try a smaller file."
          : error instanceof TypeError
            ? "Could not reach the app server."
            : error.message,
      );
    } finally {
      setBusy(null);
    }
  }
  async function run(task, q = question) {
    if (!document || busy) return;
    setError("");
    setBusy(task);
    const controller = new AbortController();
    pending.current = controller;
    try {
      const cacheKey = JSON.stringify([
        document,
        task,
        task === "ask" ? q.trim() : null,
      ]);
      let result = task === "ask" ? answerCache.current.get(cacheKey) : null;
      if (!result) {
        const response = await fetch(`/api/${task}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jd: document,
            question: q,
            ...(task === "gaps" ? { resume: activeResume } : {}),
          }),
          signal: controller.signal,
        });
        result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Something went wrong. Try again.");
        if (task === "ask") {
          if (answerCache.current.size >= 50)
            answerCache.current.delete(answerCache.current.keys().next().value);
          answerCache.current.set(cacheKey, result);
        }
      }
      if (task === "ask") {
        setHistory((h) => [...h, { question: q, ...result }]);
        setQuestion("");
      } else if (task === "prep") setPrep(result.questions);
      else setGaps(result.weakSpots);
    } catch (e) {
      if (e.name !== "AbortError")
        setError(
          e instanceof TypeError
            ? "Could not reach the app server. Check that it is running, then retry."
            : e.message,
        );
    } finally {
      if (pending.current === controller) {
        setBusy(null);
        pending.current = null;
      }
    }
  }
  function cite(line) {
    setHighlight(line);
    window.document
      .getElementById(`source-${line}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function prepText() {
    return [
      "INTERVIEW PRACTICE",
      lines[0],
      "Practice suggestions, not actual employer questions.",
      "",
      ...prep.flatMap((item) => [
        item.category.toUpperCase(),
        item.question,
        `Why: ${item.reason}`,
        ...item.citations.map((c) => `Line ${c.line}: "${c.quote}"`),
        "",
      ]),
    ].join("\n");
  }
  const evidence = (items) => (
    <div className="evidence">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => cite(item.line)}
          title="Show this line in the posting"
        >
          <span>L{String(item.line).padStart(2, "0")}</span> “{item.quote}”
        </button>
      ))}
    </div>
  );
  return (
    <>
      <header>
        <a className="brand" href="/" aria-label="JD Assistant home">
          <span className="logo">jd</span> JD Assistant
        </a>
        <span className="header-note">READ IT. UNDERSTAND IT. PREPARE.</span>
        <div className="connection">
          {configured === null
            ? "Connecting…"
            : configured
              ? "AI connected"
              : "AI setup needed"}
        </div>
      </header>
      <main>
        <div className="intro">
          <div>
            <p className="eyebrow">YOUR NEXT ROLE, IN FOCUS</p>
            <h1>
              Less guessing.
              <br className="mobile-break" /> Better preparation.
            </h1>
            <p>Answers you can trace. Practice that fits the role.</p>
          </div>
          <span className="step-label">
            01 / POSTING &nbsp; · &nbsp; 02 / EXPLORE
          </span>
        </div>
        {configured === false && (
          <div className="setup">
            <strong>Connect AI to begin.</strong> Add your Gemini or OpenAI API
            key to the server’s .env file and restart the app. Your key stays on
            the server. You can load a sample to explore the workspace.
          </div>
        )}
        <div className="workspace">
          <section className="source-panel" aria-label="Job description">
            <div className="panel-title">
              <div>
                <span className="section-number">01</span>
                <h2>Job description</h2>
              </div>
              {document && !editing && (
                <button
                  className="text-button"
                  disabled={Boolean(busy)}
                  onClick={() => setEditing(true)}
                >
                  Edit posting
                </button>
              )}
            </div>
            {editing ? (
              <>
                <label className="field-label" htmlFor="jd">
                  Paste the full posting
                </label>
                <label className="file-import">
                  Add JD from file{" "}
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    disabled={Boolean(busy)}
                    onChange={(event) => importFile(event, "jd")}
                  />
                </label>
                <p className="small-note">
                  PDF, Word (.docx/.doc), or TXT · up to 5 MB. Files are read by
                  this app without being saved.
                </p>
                <textarea
                  id="jd"
                  className="jd-input"
                  placeholder={
                    "Job title, responsibilities, requirements…\n\nInclude the full posting so every answer has the right context."
                  }
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  maxLength={24000}
                  disabled={Boolean(busy)}
                />
                <div className="input-meta">
                  <span>{jd.length.toLocaleString()} / 24,000 characters</span>
                  <button
                    className="text-button"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      setJd(SAMPLES[sampleIndex.current]);
                      sampleIndex.current =
                        (sampleIndex.current + 1) % SAMPLES.length;
                      setError("");
                    }}
                  >
                    Load sample
                  </button>
                </div>
                <details className="resume-input">
                  <summary>Add resume for likely weak spots (optional)</summary>
                  <label className="field-label" htmlFor="resume">
                    Paste resume text
                  </label>
                  <label className="file-import">
                    Add resume from file{" "}
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      disabled={Boolean(busy)}
                      onChange={(event) => importFile(event, "resume")}
                    />
                  </label>
                  <textarea
                    id="resume"
                    maxLength={24000}
                    rows="7"
                    disabled={Boolean(busy)}
                    value={resume}
                    onChange={(e) => setResume(e.target.value)}
                    placeholder="Skills, projects and experience. Omit contact details for this comparison."
                  />
                  <p className="small-note">
                    Only used when you choose Compare resume. It is sent to your
                    selected AI provider and kept in this session.
                  </p>
                </details>
                {busy === "import" && (
                  <p className="loading" role="status">
                    Reading your document…
                  </p>
                )}
                {importNotice && (
                  <p className="small-note" role="status">
                    {importNotice}
                  </p>
                )}
                <button
                  className="primary full"
                  disabled={Boolean(busy)}
                  onClick={commit}
                >
                  Use this posting
                </button>
                {document && (
                  <button
                    className="cancel"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      setJd(document);
                      setResume(activeResume);
                      setEditing(false);
                      setError("");
                    }}
                  >
                    Cancel edit
                  </button>
                )}
                <p className="privacy">
                  Your posting stays in this session. AI requests send it to
                  your selected AI provider; it is never saved by this app.
                </p>
              </>
            ) : (
              <>
                <div className="source-meta">
                  <span>{lines.length} source lines</span>
                  <span>Click a citation to find its source</span>
                </div>
                <div className="source-lines grouped-source">
                  {sourceGroups.map((group) => (
                    <section
                      className="source-group"
                      key={group.label || "title"}
                    >
                      {group.label && (
                        <h3 className="source-label">{group.label}</h3>
                      )}
                      <ul
                        className={
                          group.label
                            ? "source-points"
                            : "source-points source-title"
                        }
                      >
                        {group.points.map(({ text, line }) => (
                          <li
                            id={`source-${line}`}
                            className={highlight === line ? "highlighted" : ""}
                            key={line}
                          >
                            <span
                              className="source-line-number"
                              aria-label={`Source line ${line}`}
                            >
                              {String(line).padStart(2, "0")}
                            </span>
                            <p>
                              {text
                                .replace(
                                  /^\s*[-•]?\s*(location|work arrangement|experience|skills|requirements|responsibilities|salary|benefits|employment type|qualifications)\s*:\s*/i,
                                  "",
                                )
                                .replace(/^[-•]\s*/, "") || text}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            )}
          </section>
          <section className="explore-panel" aria-label="Explore posting">
            <div className="panel-title">
              <div>
                <span className="section-number">02</span>
                <h2>Explore the role</h2>
              </div>
              <span className="source-badge">ONE POSTING · TWO VIEWS</span>
            </div>
            <div
              className="tabs"
              role="tablist"
              aria-label="Assistant features"
            >
              <button
                id="ask-tab"
                role="tab"
                aria-selected={tab === "ask"}
                aria-controls="ask-panel"
                tabIndex={tab === "ask" ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    setTab("prep");
                    window.document.getElementById("prep-tab").focus();
                  }
                }}
                className={tab === "ask" ? "selected" : ""}
                onClick={() => setTab("ask")}
              >
                Ask a question
              </button>
              <button
                id="prep-tab"
                role="tab"
                aria-selected={tab === "prep"}
                aria-controls="prep-panel"
                tabIndex={tab === "prep" ? 0 : -1}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") {
                    setTab("ask");
                    window.document.getElementById("ask-tab").focus();
                  }
                }}
                className={tab === "prep" ? "selected" : ""}
                onClick={() => setTab("prep")}
              >
                Interview prep
              </button>
            </div>
            {tab === "ask" ? (
              <div
                id="ask-panel"
                role="tabpanel"
                aria-labelledby="ask-tab"
                className="tab-content"
              >
                <div className="section-intro">
                  <h3>Get the details that matter.</h3>
                  <p>
                    Ask about requirements, work arrangements or anything else
                    in the posting.
                  </p>
                </div>
                {history.length === 0 && (
                  <div className="starter">
                    <span className="mini-label">A FEW PLACES TO START</span>
                    <div className="suggestions">
                      {[
                        "Is this role remote?",
                        "What experience do I need?",
                        "Do they mention visa sponsorship?",
                      ].map((q) => (
                        <button
                          key={q}
                          disabled={!document || editing || Boolean(busy)}
                          onClick={() => setQuestion(q)}
                        >
                          {q}
                          <span>+</span>
                        </button>
                      ))}
                    </div>
                    <div className="grounding-note">
                      <span className="quote-mark">“</span>
                      <div>
                        <strong>Evidence first.</strong>
                        <p>
                          If the posting doesn’t say it, you’ll see “Not stated
                          in this posting.” Any inference is labeled.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="conversation" aria-live="polite">
                  {history.map((item, i) => (
                    <article className="answer" key={i}>
                      <p className="asked">{item.question}</p>
                      <div className="answer-heading">
                        <span className={`status ${item.status}`}>
                          {item.status === "stated"
                            ? "From the posting"
                            : item.status === "inferred"
                              ? "Inference · verify with the recruiter"
                              : "Not stated"}
                        </span>
                      </div>
                      <p>{item.answer}</p>
                      {item.citations.length > 0 && evidence(item.citations)}
                    </article>
                  ))}
                  {busy === "ask" && (
                    <div className="loading">
                      Reading the posting and checking evidence…
                    </div>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run("ask");
                  }}
                >
                  <label htmlFor="question" className="field-label">
                    Your question
                  </label>
                  <div className="question-box">
                    <textarea
                      id="question"
                      rows="2"
                      maxLength={1000}
                      value={question}
                      disabled={!document || editing || Boolean(busy)}
                      placeholder={
                        document
                          ? "What would you like to know?"
                          : "Add a posting to start asking questions."
                      }
                      onChange={(e) => setQuestion(e.target.value)}
                    />
                    <button
                      className="primary"
                      type="submit"
                      disabled={
                        !question.trim() ||
                        !document ||
                        editing ||
                        Boolean(busy) ||
                        !configured
                      }
                    >
                      {busy === "ask" ? "Checking…" : "Ask"}
                    </button>
                  </div>
                  <p className="small-note">
                    Grounded in your posting. No outside sources.
                  </p>
                </form>
              </div>
            ) : (
              <div
                id="prep-panel"
                role="tabpanel"
                aria-labelledby="prep-tab"
                className="tab-content"
              >
                <div className="section-intro">
                  <h3>Practice for this role.</h3>
                  <p>
                    A focused set of questions, each tied to a responsibility or
                    requirement.
                  </p>
                </div>
                <button
                  className="primary"
                  disabled={
                    !document || editing || Boolean(busy) || !configured
                  }
                  onClick={() => run("prep")}
                >
                  {busy === "prep"
                    ? "Preparing…"
                    : prep
                      ? "Regenerate questions"
                      : "Generate interview prep"}
                </button>
                {prep?.length > 0 && (
                  <details className="prep-export">
                    <summary>Copy prep text</summary>
                    <label className="field-label" htmlFor="prep-text">
                      Select and copy into your notes
                    </label>
                    <textarea
                      id="prep-text"
                      readOnly
                      value={prepText()}
                      onFocus={(event) => event.target.select()}
                    />
                  </details>
                )}
                <p className="small-note">
                  Practice suggestions, not the employer’s actual interview
                  questions.
                </p>
                {!prep && busy !== "prep" && (
                  <div className="prep-empty">
                    {[
                      [
                        "01",
                        "Technical",
                        "The tools and skills in the posting.",
                      ],
                      [
                        "02",
                        "Behavioral",
                        "How you work with others and solve problems.",
                      ],
                      [
                        "03",
                        "Role-specific",
                        "The responsibilities you’ll take on.",
                      ],
                    ].map(([n, title, text]) => (
                      <div key={n}>
                        <span>{n}</span>
                        <div>
                          <h4>{title}</h4>
                          <p>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {busy === "prep" && (
                  <div className="loading" role="status">
                    Building a focused practice set from the posting…
                  </div>
                )}
                {prep && (
                  <div aria-live="polite">
                    {prep.length === 0 ? (
                      <p>
                        No interview topics could be grounded in this posting.
                        Try a fuller job description.
                      </p>
                    ) : (
                      ["technical", "behavioral", "role-specific"].map(
                        (category) => {
                          const group = prep.filter(
                            (q) => q.category === category,
                          );
                          return (
                            group.length > 0 && (
                              <section className="prep-group" key={category}>
                                <h4>{category}</h4>
                                {group.map((item, i) => (
                                  <article key={i}>
                                    <h5>{item.question}</h5>
                                    <p>{item.reason}</p>
                                    {evidence(item.citations)}
                                  </article>
                                ))}
                              </section>
                            )
                          );
                        },
                      )
                    )}
                  </div>
                )}
                <section className="weak-spots">
                  <h3>Likely weak spots</h3>
                  <p className="small-note">
                    Gaps in what your resume demonstrates, not a judgment of
                    your ability.
                  </p>
                  {activeResume.trim() ? (
                    <>
                      <button
                        className="primary"
                        disabled={editing || Boolean(busy) || !configured}
                        onClick={() => run("gaps")}
                      >
                        {busy === "gaps"
                          ? "Comparing…"
                          : gaps
                            ? "Compare again"
                            : "Compare resume"}
                      </button>
                      {busy === "gaps" && (
                        <p className="loading" role="status">
                          Checking JD requirements against your resume…
                        </p>
                      )}
                      {gaps && (
                        <div aria-live="polite">
                          {gaps.length === 0 ? (
                            <p>
                              No clear evidence gaps were found for this
                              posting.
                            </p>
                          ) : (
                            gaps.map((item, index) => (
                              <article key={index}>
                                <h4>{item.topic}</h4>
                                <span className="status">
                                  {item.status === "not_demonstrated"
                                    ? "Not demonstrated in resume"
                                    : "Partially demonstrated"}
                                </span>
                                <p>{item.reason}</p>
                                {evidence(item.jdCitations)}
                                <div className="resume-evidence">
                                  {item.resumeCitations.length > 0 ? (
                                    item.resumeCitations.map((c, i) => (
                                      <p key={i}>
                                        Resume line {c.line}: “{c.quote}”
                                      </p>
                                    ))
                                  ) : (
                                    <p>
                                      No matching resume evidence identified.
                                    </p>
                                  )}
                                </div>
                              </article>
                            ))
                          )}
                        </div>
                      )}
                      <details>
                        <summary>View numbered resume source</summary>
                        <ol>
                          {activeResume
                            .split(/\r?\n/)
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((text, i) => (
                              <li key={i}>{text}</li>
                            ))}
                        </ol>
                      </details>
                    </>
                  ) : (
                    <p className="small-note">
                      Use Edit posting to add a resume, then apply the posting.
                    </p>
                  )}
                </section>
              </div>
            )}
          </section>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
            <button aria-label="Dismiss error" onClick={() => setError("")}>
              ×
            </button>
          </div>
        )}
        <footer>
          <span>JD Assistant</span>
          <span>
            Check the source. Ask the recruiter when something is missing.
          </span>
        </footer>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
