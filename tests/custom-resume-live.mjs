import fs from "node:fs";
const frontend = `Frontend Engineer - Fictional Example Company
Experience: 1-3 years building web applications.
Required: React, JavaScript, HTML, CSS and REST API integration.
Build responsive interfaces from Figma designs.
Write component tests with React Testing Library.
Implement keyboard navigation and accessible form labels.
Use Git pull requests and explain decisions in code reviews.`;
const backend = `Python Backend Engineer - Fictional Example Company
Experience: 3+ years developing backend services.
Build Python REST APIs with FastAPI and PostgreSQL.
Write pytest integration tests and optimize SQL queries.
Deploy Docker services on AWS and monitor production errors.
Collaborate with product teams and document API contracts.`;
const unrelated = `Fictional candidate - Retail Associate
Experience: two years supporting customers in a retail shop.
Skills: customer service, Excel stock tracking and cash reconciliation.
Organized product displays and answered customer questions.
Education: undergraduate business degree.`;
const matched = `Fictional frontend engineer - 2 years of professional experience.
Skills: React, JavaScript, HTML, CSS, Git, REST APIs and Figma.
Built responsive booking interfaces from Figma designs with accessible form labels and keyboard navigation.
Wrote component tests with React Testing Library for errors and loading states.
Integrated REST APIs, reviewed Git pull requests and explained design decisions in code reviews.`;
const results = [];
const delay = () => new Promise((r) => setTimeout(r, 5000));
async function request(task, body, name, check) {
  const res = await fetch("http://localhost:3000/api/" + task, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  let passed = false;
  try {
    passed = check(res.status, data);
  } catch {}
  results.push({ name, status: res.status, passed, response: data });
  console.log(name + ": " + (passed ? "PASS" : "FAIL"));
  await delay();
  return data;
}
await request(
  "resume",
  { jd: frontend, profile: "invalid" },
  "Invalid profile rejected",
  (s) => s === 400,
);
await request(
  "resume",
  { jd: "short", profile: "strong" },
  "Short JD rejected",
  (s) => s === 400,
);
const strong = await request(
  "resume",
  { jd: frontend, profile: "strong" },
  "Custom frontend JD creates a fictional role-related resume",
  (s, d) =>
    s === 200 &&
    d.resumeText.startsWith("FICTIONAL SAMPLE RESUME") &&
    /React/i.test(d.resumeText) &&
    /Testing Library/i.test(d.resumeText) &&
    d.jdCitations.length > 0,
);
if (strong.resumeText)
  await request(
    "gaps",
    { jd: frontend, resume: strong.resumeText },
    "Generated strong resume comparison accepts valid response",
    (s, d) => s === 200 && Array.isArray(d.weakSpots),
  );
const partial = await request(
  "resume",
  { jd: backend, profile: "partial" },
  "Different backend JD creates a different related resume",
  (s, d) =>
    s === 200 &&
    /Python/i.test(d.resumeText) &&
    d.resumeText !== strong.resumeText,
);
if (partial.resumeText)
  await request(
    "gaps",
    { jd: backend, resume: partial.resumeText },
    "Generated partial resume produces cited gaps",
    (s, d) =>
      s === 200 &&
      d.weakSpots.length > 0 &&
      d.weakSpots.every((g) => g.jdCitations.length > 0),
  );
await request(
  "gaps",
  { jd: frontend, resume: unrelated },
  "Different pasted resume produces cited missing skills",
  (s, d) =>
    s === 200 &&
    d.weakSpots.length > 0 &&
    d.weakSpots.every((g) => g.jdCitations.length > 0),
);
await request(
  "gaps",
  { jd: frontend, resume: matched },
  "Matching pasted resume returns no clear gaps",
  (s, d) => s === 200 && d.weakSpots.length === 0,
);
fs.writeFileSync(
  "CUSTOM_RESUME_TEST_RESULTS.json",
  JSON.stringify({ date: "2026-10-05", provider: "gemini", results }, null, 2),
);
console.log(
  `${results.filter((r) => r.passed).length}/${results.length} passed`,
);
process.exitCode = results.every((r) => r.passed) ? 0 : 1;
