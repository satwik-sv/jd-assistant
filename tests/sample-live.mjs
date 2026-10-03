// Real API evaluation using fictional, realistic role/resume examples, never real personal resumes.
import { writeFile } from "node:fs/promises";
import { SAMPLES } from "../src/sample-postings.js";
import { SAMPLE_RESUMES } from "../src/sample-resumes.js";
import { prepBudget } from "../src/prep-policy.js";
const checks = [];
async function check(name, task, body, verify) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const started = Date.now();
  try {
    const response = await fetch("http://localhost:3000/api/" + task, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55000),
    });
    const result = await response.json();
    const passed = response.ok && verify(result);
    checks.push({
      name,
      passed,
      httpStatus: response.status,
      elapsedMs: Date.now() - started,
      result,
    });
    console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
  } catch (error) {
    checks.push({ name, passed: false, error: error.message });
    console.log("FAIL " + name);
  }
}
for (let i = 0; i < SAMPLES.length; i++) {
  const jd = SAMPLES[i],
    resume = SAMPLE_RESUMES[i],
    role = jd.split("\n")[0],
    budget = prepBudget(jd);
  await check(
    role + " / absence",
    "ask",
    { jd, question: "What is the annual paid leave allowance?" },
    (r) =>
      r.status === "not_stated" &&
      r.answer === "Not stated in this posting." &&
      r.citations.length === 0,
  );
  await check(
    role + " / prep",
    "prep",
    { jd },
    (r) =>
      r.questions.length >= (budget === 15 ? 9 : 3) &&
      r.questions.length <= budget &&
      r.questions.every((q) => q.citations.length > 0),
  );
  await check(
    role + " / resume",
    "gaps",
    { jd, resume },
    (r) =>
      r.weakSpots.length > 0 &&
      r.weakSpots.length <= 3 &&
      r.weakSpots.every((x) => x.jdCitations.length > 0),
  );
}
const medium =
  SAMPLES[0] +
  "\nOwn API authentication and authorization.\nInvestigate accessibility issues with designers.\nDocument service architecture and deployment runbooks.";
await check(
  "Medium posting / expanded prep",
  "prep",
  { jd: medium },
  (r) => r.questions.length >= 7 && r.questions.length <= 10,
);
await writeFile(
  "SAMPLE_TEST_RESULTS.json",
  JSON.stringify(
    {
      testedAt: new Date().toISOString(),
      dataset:
        "Eight fictional JD/resume pairs and one medium posting; public role patterns inform the longer SRE example.",
      passed: checks.filter((x) => x.passed).length,
      total: checks.length,
      checks,
    },
    null,
    2,
  ),
);
if (checks.some((x) => !x.passed)) process.exitCode = 1;
