import test from "node:test";
import assert from "node:assert/strict";
import { readDocument, validateResult, generate } from "../server/grounding.js";
import { sourceLabel } from "../src/source-label.js";
const lines = readDocument(
  "Engineer\nRemote within India. Build React applications.",
);
test("Source labels preserve content and normalize explicit capitalization", () => {
  assert.equal(sourceLabel("location: Bengaluru.", 1), "Location");
  assert.equal(
    sourceLabel("We seek 3+ years of professional experience.", 2),
    "Experience",
  );
  assert.equal(
    sourceLabel("Build React applications.", 3),
    "Skills & responsibilities",
  );
  assert.equal(
    sourceLabel("Collaborate with designers.", 4),
    "Responsibilities",
  );
  assert.equal(sourceLabel("Job title", 0), null);
});
test("Reject null, primitive and malformed model outputs", () => {
  for (const value of [null, [], 42, "text"])
    assert.throws(
      () => validateResult("ask", value, lines),
      /Invalid AI response/,
    );
  assert.throws(
    () =>
      validateResult(
        "ask",
        { status: "stated", answer: "Remote", citations: [null] },
        lines,
      ),
    /invalid evidence/,
  );
  assert.throws(
    () => validateResult("prep", { questions: [null] }, lines),
    /Invalid interview/,
  );
});
test("Prep enforces six-question budget and permits empty grounded topics", () => {
  assert.deepEqual(validateResult("prep", { questions: [] }, lines), {
    questions: [],
  });
  assert.throws(
    () => validateResult("prep", { questions: Array(7).fill({}) }, lines),
    /Invalid interview preparation/,
  );
});
test("Reject whitespace quotes and invalid answer status", () => {
  assert.throws(() =>
    validateResult(
      "ask",
      {
        status: "stated",
        answer: "Remote",
        citations: [{ line: 2, quote: " " }],
      },
      lines,
    ),
  );
  assert.throws(() =>
    validateResult(
      "ask",
      { status: "maybe", answer: "Remote", citations: [] },
      lines,
    ),
  );
});
test("Network failures have a safe actionable message", async () => {
  await assert.rejects(
    generate("ask", lines, "Remote?", {
      apiKey: "test",
      model: "test",
      fetchImpl: async () => {
        throw new TypeError("fetch failed");
      },
    }),
    /Could not reach the AI provider/,
  );
});
test("Provider 503 and unavailable-model errors are distinguishable", async () => {
  for (const [status, message] of [
    [503, /high demand/],
    [404, /model is unavailable/],
    [401, /key was rejected/],
  ])
    await assert.rejects(
      generate("ask", lines, "Remote?", {
        apiKey: "test",
        model: "test",
        fetchImpl: async () => ({ ok: false, status }),
      }),
      message,
    );
});
test("Malformed JSON is reported without raw provider output", async () => {
  await assert.rejects(
    generate("ask", lines, "Remote?", {
      apiKey: "test",
      model: "test",
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({
          status: "completed",
          output: [{ content: [{ type: "output_text", text: "not json" }] }],
        }),
      }),
    }),
    /unreadable response/,
  );
});
