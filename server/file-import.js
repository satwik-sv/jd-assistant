import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export async function extractDocument(buffer, filename) {
  if (!Buffer.isBuffer(buffer) || !buffer.length)
    throw new Error("Choose a nonempty document.");
  if (buffer.length > MAX_FILE_BYTES)
    throw new Error("Files must be 5 MB or smaller.");
  const extension = filename?.split(".").pop()?.toLowerCase();
  if (!["pdf", "docx", "doc", "txt"].includes(extension))
    throw new Error("Choose a PDF, DOCX, DOC or TXT file.");
  let text;
  try {
    if (extension === "txt")
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    else if (extension === "docx")
      text = (await mammoth.extractRawText({ buffer })).value;
    else if (extension === "doc")
      text = (await new WordExtractor().extract(buffer)).getBody();
    else {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const info = await parser.getInfo();
        if (info.total > 50) throw new Error("TOO_MANY_PAGES");
        const result = await parser.getText({ pageJoiner: "\n" });
        text = result.text;
      } finally {
        await parser.destroy();
      }
    }
  } catch (error) {
    if (error.message === "TOO_MANY_PAGES")
      throw new Error("Use a PDF with 50 pages or fewer.");
    throw new Error(
      "Could not read this file. Check that it is a valid, unencrypted document, or paste its text.",
    );
  }
  text = text
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
  if (text.length < 30)
    throw new Error(
      "No sufficient readable text was found. Scanned PDFs need OCR; paste the extracted text instead.",
    );
  if (text.length > 24000)
    throw new Error(
      "The document exceeds 24,000 characters. Paste the relevant section instead.",
    );
  return text;
}
