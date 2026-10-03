import test from "node:test";
import assert from "node:assert/strict";
import {
  readDocument,
  validateResult,
  generate,
  NOT_STATED,
} from "../server/grounding.js";
const lines = readDocument(
  "Full Stack Engineer\n\nRemote within India.\nBuild React applications and Python APIs.",
);
test("One canonical document supplies stable line numbers for both features", () => {
  assert.deepEqual(
    lines.map((x) => x.line),
    [1, 2, 3],
  );
  assert.equal(lines[1].text, "Remote within India.");
});
test("Rejects short and oversized postings", () => {
  assert.throws(() => readDocument(""));
  assert.throws(() => readDocument("a".repeat(24001)));
});
test("Not stated always produces the exact required wording without invented evidence", () => {
  assert.deepEqual(
    validateResult(
      "ask",
      {
        status: "not_stated",
        answer: "Maybe yes",
        citations: [{ line: 2, quote: "Remote" }],
      },
      lines,
    ),
    { status: "not_stated", answer: NOT_STATED, citations: [] },
  );
});
test("Accepts a real quote and rejects a fabricated quote or source number", () => {
  const value = {
    status: "stated",
    answer: "Remote within India.",
    citations: [{ line: 2, quote: "Remote within India." }],
  };
  assert.equal(validateResult("ask", value, lines).citations.length, 1);
  assert.throws(() =>
    validateResult(
      "ask",
      {
        ...value,
        citations: [{ line: 2, quote: "Visa sponsorship available" }],
      },
      lines,
    ),
  );
  assert.throws(() =>
    validateResult(
      "ask",
      { ...value, citations: [{ line: 99, quote: "Remote" }] },
      lines,
    ),
  );
  assert.throws(() =>
    validateResult("ask", { ...value, citations: [] }, lines),
  );
});
test("Prep uses the same evidence validator and rejects unsupported questions", () => {
  const q = {
    category: "technical",
    question: "How would you structure a React application?",
    reason: "The role builds React applications.",
    citations: [{ line: 3, quote: "Build React applications" }],
  };
  assert.equal(
    validateResult("prep", { questions: [q] }, lines).questions.length,
    1,
  );
  assert.throws(() =>
    validateResult(
      "prep",
      { questions: [{ ...q, citations: [{ line: 3, quote: "Kubernetes" }] }] },
      lines,
    ),
  );
});
test("Real API request shape uses schema, untrusted structured data and no stored response", async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        status: "completed",
        output: [
          {
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  status: "not_stated",
                  answer: NOT_STATED,
                  citations: [],
                }),
              },
            ],
          },
        ],
      }),
    };
  };
  const result = await generate("ask", lines, "Visa sponsorship?", {
    apiKey: "test-only",
    model: "test-model",
    fetchImpl,
  });
  assert.equal(result.status, "not_stated");
  assert.equal(request.url, "https://api.openai.com/v1/responses");
  assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.strict, true);
  assert.deepEqual(JSON.parse(request.body.input).posting, lines);
});
test("Handles provider failure, refusal and incomplete output", async () => {
  await assert.rejects(
    generate("ask", lines, "Remote?", {
      apiKey: "test",
      model: "test",
      fetchImpl: async () => ({ ok: false, status: 429 }),
    }),
    /quota/,
  );
  await assert.rejects(
    generate("ask", lines, "Remote?", {
      apiKey: "test",
      model: "test",
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ status: "incomplete" }),
      }),
    }),
    /incomplete/,
  );
  await assert.rejects(
    generate("ask", lines, "Remote?", {
      apiKey: "test",
      model: "test",
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({
          status: "completed",
          output: [{ content: [{ type: "refusal" }] }],
        }),
      }),
    }),
    /could not answer/,
  );
});
