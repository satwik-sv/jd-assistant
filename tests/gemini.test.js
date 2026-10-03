import test from "node:test";
import assert from "node:assert/strict";
import { generate, readDocument } from "../server/grounding.js";
test("Gemini translates the same prompt and schema and validates source evidence", async () => {
  const lines = readDocument(
    "Engineer role. Build React applications. Hybrid work.",
  );
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, headers: options.headers, body: JSON.parse(options.body) };
    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    status: "stated",
                    answer: "Hybrid work.",
                    citations: [{ line: 1, quote: "Hybrid work." }],
                  }),
                },
              ],
            },
          },
        ],
      }),
    };
  };
  const result = await generate("ask", lines, "Remote?", {
    provider: "gemini",
    model: "test-model",
    apiKey: "test-only",
    fetchImpl,
  });
  assert.equal(result.citations[0].quote, "Hybrid work.");
  assert.ok(request.url.endsWith("/test-model:generateContent"));
  assert.equal(request.headers["x-goog-api-key"], "test-only");
  assert.equal(
    request.body.generationConfig.responseMimeType,
    "application/json",
  );
  assert.deepEqual(
    JSON.parse(request.body.contents[0].parts[0].text).posting,
    lines,
  );
});
test("Gemini rejects blocked or truncated output", async () => {
  await assert.rejects(
    generate("ask", [], "Test?", {
      provider: "gemini",
      model: "test",
      apiKey: "test",
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
      }),
    }),
    /blocked or incomplete/,
  );
});
