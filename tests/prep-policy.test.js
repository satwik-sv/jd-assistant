import test from "node:test";
import assert from "node:assert/strict";
import { prepBudget } from "../src/prep-policy.js";
import { LONG_SAMPLE, SAMPLE_RESUMES } from "../src/sample-resumes.js";
import { readDocument, validateResult, generate } from "../server/grounding.js";
test("Prep budget grows with meaningful content and is capped at fifteen", () => {
  assert.equal(prepBudget("A short job posting"), 6);
  assert.equal(prepBudget("skill ".repeat(220)), 10);
  assert.equal(prepBudget("skill ".repeat(500)), 15);
  assert.equal(prepBudget("\n".repeat(40) + "Engineer"), 6);
  assert.equal(prepBudget(LONG_SAMPLE), 15);
});
test("Long posting accepts additional cited questions and rejects exceeding budget", () => {
  const lines = readDocument(LONG_SAMPLE);
  const question = {
    category: "technical",
    question: "How do you debug Linux failures?",
    reason: "Linux troubleshooting is required.",
    citations: [{ line: 5, quote: "Manage Linux systems" }],
  };
  assert.equal(
    validateResult(
      "prep",
      {
        questions: Array.from({ length: 15 }, (_, i) => ({
          ...question,
          question: question.question + " " + i,
        })),
      },
      lines,
    ).questions.length,
    15,
  );
  assert.throws(() =>
    validateResult("prep", { questions: Array(16).fill(question) }, lines),
  );
});
test("Long-document provider request communicates consistent dynamic budget", async () => {
  await generate("prep", readDocument(LONG_SAMPLE), null, {
    apiKey: "synthetic",
    model: "mock",
    provider: "gemini",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      assert.ok(body.contents[0].parts[0].text.includes("15 distinct"));
      assert.equal(body.generationConfig.maxOutputTokens, 8250);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: '{"questions":[]}' }] },
            },
          ],
        }),
      };
    },
  });
});
test("Each demonstration role has a distinct usable fictional resume", () => {
  assert.equal(SAMPLE_RESUMES.length, 8);
  assert.equal(new Set(SAMPLE_RESUMES).size, 8);
  for (const resume of SAMPLE_RESUMES)
    assert.ok(readDocument(resume).length > 4);
});
