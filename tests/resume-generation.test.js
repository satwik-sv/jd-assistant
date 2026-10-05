import test from "node:test";
import assert from "node:assert/strict";
import { generate, readDocument, validateResult } from "../server/grounding.js";
const lines = readDocument(
  "Frontend engineer. Build React interfaces and component tests.",
);
const output = {
  resumeText:
    "Fictional frontend engineer. Skills: React and component tests. Built a booking interface and tested loading states at a fictional company. Education: BSc.",
  jdCitations: [{ line: 1, quote: "Build React interfaces" }],
};
test("Generated sample resumes receive a mandatory fictional label and validated JD evidence", () => {
  const result = validateResult("resume", output, lines);
  assert.ok(result.resumeText.startsWith("FICTIONAL SAMPLE RESUME"));
  const formatted = validateResult(
    "resume",
    {
      ...output,
      resumeText: output.resumeText + " Skills: React. Education: BSc.",
    },
    lines,
  );
  assert.match(formatted.resumeText, /\n\nSkills:/);
  assert.match(formatted.resumeText, /\n\nEducation:/);
  for (const bad of [
    { ...output, resumeText: "short" },
    { ...output, resumeText: "x".repeat(12001) },
    { ...output, jdCitations: [] },
    { ...output, jdCitations: [{ line: 99, quote: "Invented" }] },
  ])
    assert.throws(() => validateResult("resume", bad, lines));
});
test("Custom resume generation passes profile and variation to Gemini with a dedicated schema", async () => {
  const result = await generate("resume", lines, null, {
    provider: "gemini",
    model: "mock",
    apiKey: "test",
    profile: "partial",
    variation: "test-variation",
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      const input = JSON.parse(body.contents[0].parts[0].text);
      assert.equal(input.profile, "partial");
      assert.equal(input.variation, "test-variation");
      assert.equal(input.abstentionRule, null);
      assert.match(
        body.systemInstruction.parts[0].text,
        /fictional sample resume/,
      );
      assert.ok(body.generationConfig.responseJsonSchema.properties.resumeText);
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: "STOP",
              content: { parts: [{ text: JSON.stringify(output) }] },
            },
          ],
        }),
      };
    },
  });
  assert.equal(result.jdCitations[0].line, 1);
});
