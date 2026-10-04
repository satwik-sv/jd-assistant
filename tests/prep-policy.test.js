import test from "node:test";
import assert from "node:assert/strict";
import { prepBudget } from "../src/prep-policy.js";
import {
  LONG_SAMPLE,
  SAMPLE_RESUMES,
  SAMPLE_RESUME_VARIANTS,
  RESUME_MATCH_LEVELS,
} from "../src/sample-resumes.js";
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

test("Resume profiles supply distinct evidence levels for every sample role", () => {
  assert.equal(SAMPLE_RESUME_VARIANTS.length, 8);
  for (const variants of SAMPLE_RESUME_VARIANTS) {
    assert.equal(new Set(Object.values(variants)).size, 3);
    for (const level of RESUME_MATCH_LEVELS) {
      assert.ok(readDocument(variants[level]).length >= 5);
      assert.match(variants[level], /fictional/i);
      assert.doesNotMatch(
        variants[level],
        /Preparation focus:|resume does not document/,
      );
    }
  }
  assert.match(SAMPLE_RESUME_VARIANTS[1].strong, /React Testing Library/);
  assert.match(SAMPLE_RESUME_VARIANTS[1].strong, /Safari/);
  assert.match(SAMPLE_RESUME_VARIANTS[1].strong, /keyboard navigation/);
  assert.doesNotMatch(
    SAMPLE_RESUME_VARIANTS[1].partial,
    /React Testing Library/,
  );
});

test("Resume comparison instructions exclude employment logistics from skill gaps", async () => {
  await generate("gaps", readDocument(LONG_SAMPLE), null, {
    apiKey: "synthetic",
    model: "mock",
    provider: "gemini",
    resumeLines: readDocument(SAMPLE_RESUME_VARIANTS[7].strong),
    fetchImpl: async (_url, options) => {
      const text = JSON.parse(options.body).contents[0].parts[0].text;
      assert.match(text, /any value within the stated range meets it/);
      assert.match(
        text,
        /Do not treat missing statements about location, on-site attendance/,
      );
      assert.match(
        text,
        /If all relevant requirements are demonstrated, return weakSpots=/,
      );
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: '{"weakSpots":[]}' }] },
            },
          ],
        }),
      };
    },
  });
});
