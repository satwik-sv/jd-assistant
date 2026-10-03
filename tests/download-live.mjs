import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const text =
  'INTERVIEW PRACTICE\nSenior Engineer\nTECHNICAL\nHow would you build an API?\nWhy: APIs are required.\nLine 3: "Build APIs"\nUnicode: Bengaluru — ₹';
const checks = [];
async function check(name, body, expected, headers = {}) {
  try {
    const response = await fetch("http://localhost:3000/api/prep-download", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body,
    });
    assert.equal(response.status, expected);
    if (expected === 200) {
      assert.equal(await response.text(), text);
      assert.ok(
        response.headers
          .get("content-disposition")
          .includes('attachment; filename="interview-prep.txt"'),
      );
      assert.ok(response.headers.get("content-type").includes("text/plain"));
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
    checks.push({ name, passed: true, httpStatus: response.status });
    console.log("PASS " + name);
  } catch (error) {
    checks.push({ name, passed: false, error: error.message });
    console.log("FAIL " + name);
  }
}
await check(
  "Download preserves questions, reasons, citations and Unicode",
  new URLSearchParams({ text }),
  200,
);
await check("Empty download rejected", new URLSearchParams({ text: "" }), 400);
await check("Missing text rejected", new URLSearchParams({ other: "x" }), 400);
await check("Duplicate text fields rejected", "text=one&text=two", 400);
await check(
  "Excessive export rejected",
  new URLSearchParams({ text: "x".repeat(60001) }),
  400,
);
await check(
  "Cross-origin export rejected",
  new URLSearchParams({ text }),
  403,
  { Origin: "https://unrelated.example" },
);
await writeFile(
  "DOWNLOAD_TEST_RESULTS.json",
  JSON.stringify(
    {
      testedAt: new Date().toISOString(),
      passed: checks.filter((x) => x.passed).length,
      total: checks.length,
      checks,
    },
    null,
    2,
  ),
);
if (checks.some((x) => !x.passed)) process.exitCode = 1;
