import { SAMPLES } from "./sample-postings.js";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { groupSourceLines } from "./source-label.js";
import { prepBudget } from "./prep-policy.js";
import {
  selectSampleResume,
  RESUME_PROFILE_OPTIONS,
} from "./sample-resumes.js";
function App() {
  const [jd, setJd] = useState(""),
    [document, setDocument] = useState(null),
    [editing, setEditing] = useState(true),
    [tab, setTab] = useState("ask"),
    [question, setQuestion] = useState(""),
    [history, setHistory] = useState([]),
    [prep, setPrep] = useState(null),
    [resume, setResume] = useState(""),
    [resumeMatch, setResumeMatch] = useState("strong"),
    [activeResume, setActiveResume] = useState(""),
    [gaps, setGaps] = useState(null),
    [importNotice, setImportNotice] = useState(""),
    [busy, setBusy] = useState(null),
    [error, setError] = useState(""),
    [configured, setConfigured] = useState(null),
    [highlight, setHighlight] = useState(null),
    [showSourceNumbers, setShowSourceNumbers] = useState(false);
  const pending = useRef(null);
  const answerCache = useRef(new Map());
  const sampleIndex = useRef(0);
  const sampleRole = SAMPLES.indexOf(jd);
  const resumeDetails = useRef(null);
  const resumeSequences = useRef(new Map());
  function loadResumeExample(role, profile) {
    const key = `${role}:${profile}`;
    const sequence = resumeSequences.current.get(key) || 0;
    const example = selectSampleResume(role, profile, sequence);
    resumeSequences.current.set(key, sequence + 1);
    setResume(example.text);
    setImportNotice(
      `Fictional ${profile.replace("-", " ")} resume loaded: example ${example.example} of ${example.total}. Use this posting to apply it.`,
    );
  }
  const lines =
    document
      ?.split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean) || [];
  const sourceGroups = groupSourceLines(lines);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((x) => setConfigured(x.configured))
      .catch(() =>
        setError("Could not connect to the server. Refresh to try again."),
      );
    return () => pending.current?.abort();
  }, []);
  useEffect(() => {
    if (editing && tab === "resume" && resumeDetails.current) {
      resumeDetails.current.open = true;
    }
  }, [editing, tab]);
  function editResume() {
    setTab("resume");
    setEditing(true);
  }
  function navigateTabs(event) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const names = ["ask", "prep", "resume"];
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? 2
          : (names.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
    setTab(names[next]);
    window.document.getElementById(names[next] + "-tab")?.focus();
  }
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
  const resumePanel = (
    <section className="weak-spots">
      <h3>Likely weak spots</h3>
      <button
        className="text-button"
        disabled={Boolean(busy)}
        onClick={editResume}
      >
        {activeResume.trim() ? "Edit resume" : "Add resume"}
      </button>
      <p className="small-note">
        Gaps in what your resume demonstrates, not a judgment of your ability.
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
                <p>No clear evidence gaps were found for this posting.</p>
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
                        <p>No matching resume evidence identified.</p>
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
          Add an optional resume, then click Use this posting to save it for
          comparison.
        </p>
      )}
    </section>
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
                    className="sample-button"
                    disabled={Boolean(busy)}
                    onClick={() => {
                      setJd(SAMPLES[sampleIndex.current]);
                      setImportNotice(
                        "Sample JD loaded. Your resume is unchanged; load a sample resume separately if needed.",
                      );
                      sampleIndex.current =
                        (sampleIndex.current + 1) % SAMPLES.length;
                      setError("");
                    }}
                  >
                    Load sample JD
                  </button>
                </div>
                <details className="resume-input" ref={resumeDetails}>
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
                  <div className="sample-resume-controls">
                    <p className="mini-label">TRY A DIFFERENT CANDIDATE</p>
                    <h4>Choose a resume profile</h4>
                    <fieldset className="profile-options">
                      <legend className="sr-only">Sample resume profile</legend>
                      {RESUME_PROFILE_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className={
                            "profile-option " +
                            (resumeMatch === option.value ? "active" : "")
                          }
                        >
                          <input
                            type="radio"
                            name="resume-profile"
                            value={option.value}
                            checked={resumeMatch === option.value}
                            disabled={Boolean(busy)}
                            onChange={() => setResumeMatch(option.value)}
                          />
                          <span>
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <button
                      className="sample-button"
                      disabled={
                        Boolean(busy) ||
                        sampleRole < 0 ||
                        jd !== SAMPLES[sampleRole]
                      }
                      onClick={() => loadResumeExample(sampleRole, resumeMatch)}
                    >
                      Load sample resume
                    </button>
                    <p className="small-note">
                      Three different work histories per profile. Each click
                      loads the next example; examples cycle after three. Load a
                      sample JD first. Your uploaded resume stays editable.
                    </p>
                  </div>
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
                  <p className="sample-note">
                    JD and resume samples load separately. Resume profiles offer
                    different levels of evidence and never represent your
                    experience.
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
                  <button
                    className="text-button"
                    aria-pressed={showSourceNumbers}
                    onClick={() => setShowSourceNumbers((value) => !value)}
                  >
                    {showSourceNumbers
                      ? "Hide line numbers"
                      : "Show line numbers"}
                  </button>
                </div>
                <div
                  className={
                    "source-lines grouped-source " +
                    (showSourceNumbers ? "show-line-numbers" : "")
                  }
                >
                  {sourceGroups.map((group, groupIndex) => (
                    <section className="source-group" key={groupIndex}>
                      {group.label && (
                        <h3
                          id={
                            group.headingLine
                              ? `source-${group.headingLine}`
                              : undefined
                          }
                          className={
                            "source-label " +
                            (highlight === group.headingLine
                              ? "highlighted"
                              : "")
                          }
                          title={group.headingText || group.label}
                        >
                          <span className="source-section-number">
                            {groupIndex + 1}.
                          </span>{" "}
                          {group.label}
                          {showSourceNumbers && group.headingLine && (
                            <small> · L{group.headingLine}</small>
                          )}
                        </h3>
                      )}
                      <ul
                        className={
                          group.label === "Job title"
                            ? "source-points source-title"
                            : "source-points"
                        }
                      >
                        {group.points.map(({ displayText, line }) => (
                          <li
                            id={`source-${line}`}
                            aria-label={`Source line ${line}`}
                            className={highlight === line ? "highlighted" : ""}
                            key={line}
                          >
                            <span
                              className="source-line-number"
                              aria-label={`Source line ${line}`}
                            >
                              {String(line).padStart(2, "0")}
                            </span>
                            <p>{displayText}</p>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
                <div className="resume-summary">
                  <span className="mini-label">OPTIONAL RESUME</span>
                  <strong>
                    {activeResume.trim()
                      ? "Resume attached"
                      : "No resume added"}
                  </strong>
                  <p>
                    {activeResume.trim()
                      ? activeResume.trim().split(/\r?\n/)[0]
                      : "Compare your resume with this posting to spot evidence gaps."}
                  </p>
                  <button
                    className="text-button"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      activeResume.trim() ? setTab("resume") : editResume()
                    }
                  >
                    {activeResume.trim()
                      ? "Review and compare resume →"
                      : "Add resume →"}
                  </button>
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
              <span className="source-badge">ONE POSTING · THREE VIEWS</span>
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
                onKeyDown={navigateTabs}
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
                onKeyDown={navigateTabs}
                className={tab === "prep" ? "selected" : ""}
                onClick={() => setTab("prep")}
              >
                Interview prep
              </button>
              <button
                id="resume-tab"
                role="tab"
                aria-selected={tab === "resume"}
                aria-controls="resume-panel"
                tabIndex={tab === "resume" ? 0 : -1}
                onKeyDown={navigateTabs}
                className={tab === "resume" ? "selected" : ""}
                onClick={() => setTab("resume")}
              >
                Resume check
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
            ) : tab === "prep" ? (
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
                  {document && (
                    <p className="prep-budget">
                      Up to {prepBudget(document)} questions for this posting ·
                      longer postings get a larger practice set.
                    </p>
                  )}
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
                  <div className="prep-tools">
                    <form action="/api/prep-download" method="post">
                      <input type="hidden" name="text" value={prepText()} />
                      <button
                        className="download-button"
                        type="submit"
                        disabled={Boolean(busy)}
                      >
                        Download prep (.txt)
                      </button>
                    </form>
                    <span className="small-note">
                      {prep.length} questions · reasons and source citations
                      included
                    </span>
                  </div>
                )}
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
                                <h4>
                                  {category}
                                  <span className="question-count">
                                    {group.length} questions
                                  </span>
                                </h4>
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
                <button
                  className="text-button"
                  onClick={() => setTab("resume")}
                >
                  Open resume check →
                </button>
              </div>
            ) : (
              <div
                id="resume-panel"
                role="tabpanel"
                aria-labelledby="resume-tab"
                className="tab-content"
              >
                {editing && (
                  <p className="small-note">
                    Save your changes with Use this posting before comparing.
                  </p>
                )}
                {!document && (
                  <p className="small-note">
                    Start by loading or adding a job description.
                  </p>
                )}
                {resumePanel}
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
