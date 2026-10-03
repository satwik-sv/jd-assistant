// Synthetic documents only. Run against the local server; resume checks call the configured AI.
import { writeFile } from "node:fs/promises";
import JSZip from "jszip";
const jd =
  "Software Engineer\nLocation: Remote within India.\nBuild React applications and Python APIs.\nDesign PostgreSQL databases.";
const resume =
  "Candidate\nBuilt React applications for three years.\nCollaborated with product designers.";
function pdf(content) {
  const stream = `BT /F1 12 Tf 50 750 Td (${content}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let result = "%PDF-1.4\n",
    offsets = [0];
  objects.forEach((x, i) => {
    offsets.push(Buffer.byteLength(result));
    result += `${i + 1} 0 obj\n${x}\nendobj\n`;
  });
  const xref = Buffer.byteLength(result);
  result +=
    "xref\n0 6\n0000000000 65535 f \n" +
    offsets
      .slice(1)
      .map((x) => String(x).padStart(10, "0") + " 00000 n \n")
      .join("") +
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(result);
}
const zip = new JSZip();
zip.file(
  "[Content_Types].xml",
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
);
zip.file(
  "word/document.xml",
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
    jd
      .split("\n")
      .map((x) => "<w:p><w:r><w:t>" + x + "</w:t></w:r></w:p>")
      .join("") +
    "</w:body></w:document>",
);
const docx = await zip.generateAsync({ type: "nodebuffer" });
await writeFile("tests/sample-posting.txt", jd);
await writeFile(
  "tests/sample-posting.pdf",
  pdf("Software Engineer. Build React applications and Python APIs."),
);
await writeFile("tests/sample-posting.docx", docx);
await writeFile("tests/sample-resume.txt", resume);
const checks = [];
async function check(
  name,
  path,
  body,
  verify,
  headers = { "Content-Type": "application/json" },
) {
  try {
    const r = await fetch("http://localhost:3000/api/" + path, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(55000),
    });
    const b = await r.json();
    checks.push({ name, passed: verify(r, b), status: r.status, result: b });
    console.log(`${checks.at(-1).passed ? "PASS" : "FAIL"} ${name}`);
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
    console.log("FAIL " + name);
  }
}
async function upload(name, body, valid = true) {
  await check(
    "Import " + name,
    "import",
    body,
    (r, b) => (valid ? r.ok && b.text.length >= 30 : r.status === 400),
    {
      "Content-Type": "application/octet-stream",
      "x-file-name": encodeURIComponent(name),
    },
  );
}
await upload("posting.txt", Buffer.from(jd));
await upload("posting.docx", docx);
await upload(
  "posting.pdf",
  pdf("Software Engineer. Build React applications and Python APIs."),
);
await upload("blank.pdf", pdf(""), false);
await upload("corrupt.doc", Buffer.from(jd), false);
await upload("unsupported.exe", Buffer.from(jd), false);
await upload("oversized.txt", Buffer.alloc(5 * 1024 * 1024 + 1), false);
await check(
  "Missing resume",
  "gaps",
  JSON.stringify({ jd }),
  (r) => r.status === 400,
);
await check(
  "Resume weak spots",
  "gaps",
  JSON.stringify({ jd, resume }),
  (r, b) =>
    r.ok &&
    b.weakSpots.length > 0 &&
    b.weakSpots.every((x) => !x.topic.toLowerCase().includes("react")),
);
await check(
  "Fully matched resume",
  "gaps",
  JSON.stringify({
    jd,
    resume:
      "Candidate\nBuilt React applications and Python APIs.\nDesigned PostgreSQL databases.",
  }),
  (r, b) => r.ok && b.weakSpots.length === 0,
);
await writeFile(
  "OPTIONAL_TEST_RESULTS.json",
  JSON.stringify(
    {
      ranAt: new Date().toISOString(),
      passed: checks.filter((x) => x.passed).length,
      total: checks.length,
      checks,
    },
    null,
    2,
  ),
);
if (checks.some((x) => !x.passed)) process.exitCode = 1;
