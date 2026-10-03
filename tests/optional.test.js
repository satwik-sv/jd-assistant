import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { extractDocument } from "../server/file-import.js";
import { readDocument, validateResult } from "../server/grounding.js";
const text =
  "Software Engineer\nBuild React applications and Python APIs.\nExperience: three years.";
test("TXT import preserves readable source", async () =>
  assert.equal(await extractDocument(Buffer.from(text), "posting.TXT"), text));
test("DOCX import extracts paragraphs", async () => {
  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  );
  zip.file(
    "word/document.xml",
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      text
        .split("\n")
        .map((x) => "<w:p><w:r><w:t>" + x + "</w:t></w:r></w:p>")
        .join("") +
      "</w:body></w:document>",
  );
  const result = await extractDocument(
    await zip.generateAsync({ type: "nodebuffer" }),
    "posting.docx",
  );
  assert.ok(result.includes("Build React applications and Python APIs."));
});
test("Import rejects empty, unsupported, corrupt, oversized and excessive text files", async () => {
  for (const [buffer, name] of [
    [Buffer.alloc(0), "x.txt"],
    [Buffer.from(text), "x.exe"],
    [Buffer.from(text), "x.doc"],
    [Buffer.from(text), "x.pdf"],
    [Buffer.alloc(5 * 1024 * 1024 + 1), "x.txt"],
    [Buffer.from("a".repeat(24001)), "x.txt"],
    [Buffer.from([255]), "x.txt"],
  ])
    await assert.rejects(extractDocument(buffer, name));
});
const jd = readDocument(text),
  resume = readDocument("Candidate\nBuilt React applications for two years.");
const item = {
  topic: "Python APIs",
  reason:
    "The resume does not demonstrate Python APIs; prepare a relevant example.",
  status: "not_demonstrated",
  jdCitations: [{ line: 2, quote: "Python APIs" }],
  resumeCitations: [],
};
test("Missing resume evidence requires valid JD evidence and no invented resume citation", () => {
  assert.equal(
    validateResult("gaps", { weakSpots: [item] }, jd, resume).weakSpots.length,
    1,
  );
  assert.throws(() =>
    validateResult(
      "gaps",
      {
        weakSpots: [
          { ...item, resumeCitations: [{ line: 1, quote: "Candidate" }] },
        ],
      },
      jd,
      resume,
    ),
  );
  assert.throws(() =>
    validateResult(
      "gaps",
      { weakSpots: [{ ...item, jdCitations: [] }] },
      jd,
      resume,
    ),
  );
});
test("Partial resume evidence must exactly match the numbered resume", () => {
  const partial = {
    ...item,
    status: "partially_demonstrated",
    resumeCitations: [{ line: 2, quote: "Built React applications" }],
  };
  assert.equal(
    validateResult("gaps", { weakSpots: [partial] }, jd, resume).weakSpots
      .length,
    1,
  );
  assert.throws(() =>
    validateResult(
      "gaps",
      {
        weakSpots: [
          { ...partial, resumeCitations: [{ line: 2, quote: "Python" }] },
        ],
      },
      jd,
      resume,
    ),
  );
});
test("Resume comparison accepts no gaps and rejects malformed or excessive results", () => {
  assert.deepEqual(validateResult("gaps", { weakSpots: [] }, jd, resume), {
    weakSpots: [],
  });
  for (const value of [
    { weakSpots: [null] },
    { weakSpots: [item, item, item, item] },
    {},
  ])
    assert.throws(() => validateResult("gaps", value, jd, resume));
});
