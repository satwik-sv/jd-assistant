import "dotenv/config";
import express from "express";
import { randomUUID } from "node:crypto";
import { readDocument, generate } from "./grounding.js";
import { fileURLToPath } from "node:url";
import { extractDocument } from "./file-import.js";
const app = express();
const provider =
  process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? "gemini" : "openai");
const apiKey =
  provider === "gemini"
    ? process.env.GEMINI_API_KEY
    : process.env.OPENAI_API_KEY;
const model =
  provider === "gemini"
    ? process.env.GEMINI_MODEL || "gemini-3.1-flash-lite"
    : process.env.OPENAI_MODEL || "gpt-4.1-mini";
app.disable("x-powered-by");
app.use(express.json({ limit: "180kb" }));
app.get("/api/health", (_req, res) =>
  res.json({ configured: Boolean(apiKey), provider }),
);
let active = 0;
app.post(
  "/api/prep-download",
  express.urlencoded({ extended: false, limit: "100kb" }),
  (req, res) => {
    const origin = req.get("origin");
    if (origin && origin !== `${req.protocol}://${req.get("host")}`)
      return res
        .status(403)
        .json({ error: "Cross-origin requests are not allowed." });
    if (
      typeof req.body?.text !== "string" ||
      !req.body.text.trim() ||
      req.body.text.length > 60000
    )
      return res
        .status(400)
        .json({ error: "No valid preparation text to download." });
    res
      .set("Cache-Control", "no-store")
      .attachment("interview-prep.txt")
      .type("text/plain")
      .send(req.body.text);
  },
);
app.post(
  "/api/import",
  express.raw({ type: "application/octet-stream", limit: "5mb" }),
  async (req, res) => {
    const origin = req.get("origin");
    if (origin && origin !== `${req.protocol}://${req.get("host")}`)
      return res
        .status(403)
        .json({ error: "Cross-origin requests are not allowed." });
    if (active >= 3)
      return res
        .status(429)
        .json({ error: "Too many requests. Please wait a moment." });
    active++;
    try {
      res.json({
        text: await extractDocument(
          req.body,
          decodeURIComponent(req.get("x-file-name") || ""),
        ),
      });
    } catch (error) {
      res.status(400).json({
        error: error instanceof URIError ? "Invalid filename." : error.message,
      });
    } finally {
      active--;
    }
  },
);
app.post("/api/:task", async (req, res) => {
  if (!["ask", "prep", "gaps", "resume"].includes(req.params.task))
    return res.status(404).json({ error: "Unknown action." });
  const origin = req.get("origin");
  if (origin && origin !== `${req.protocol}://${req.get("host")}`)
    return res
      .status(403)
      .json({ error: "Cross-origin requests are not allowed." });
  if (!apiKey)
    return res.status(503).json({
      error:
        "AI is not connected yet. Set GEMINI_API_KEY or OPENAI_API_KEY for your selected provider in .env and restart.",
    });
  if (active >= 3)
    return res
      .status(429)
      .json({ error: "Too many requests. Please wait a moment." });
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
      return res.status(400).json({
        error: "Send a JSON object containing the posting and question.",
      });
    const lines = readDocument(req.body.jd);
    if (
      req.params.task === "resume" &&
      !["strong", "partial", "career-change"].includes(req.body.profile)
    )
      return res
        .status(400)
        .json({ error: "Choose a valid sample resume profile." });
    let resumeLines = [];
    if (req.params.task === "gaps") {
      if (
        typeof req.body.resume !== "string" ||
        req.body.resume.trim().length < 30 ||
        req.body.resume.length > 24000
      )
        return res.status(400).json({
          error:
            "Paste a resume between 30 and 24,000 characters for comparison.",
        });
      resumeLines = readDocument(req.body.resume);
    }
    if (
      req.params.task === "ask" &&
      (typeof req.body.question !== "string" ||
        !req.body.question.trim() ||
        req.body.question.length > 1000)
    )
      return res
        .status(400)
        .json({ error: "Enter a question under 1,000 characters." });
    active++;
    try {
      res.json(
        await generate(req.params.task, lines, req.body.question, {
          apiKey,
          model,
          provider,
          resumeLines,
          profile: req.body.profile,
          variation: req.params.task === "resume" ? randomUUID() : "",
        }),
      );
    } finally {
      active--;
    }
  } catch (error) {
    res.status(error.name === "TimeoutError" ? 504 : error.status || 400).json({
      error:
        error.name === "TimeoutError"
          ? "The AI took too long. Please try again."
          : error.message,
    });
  }
});
app.use(express.static(fileURLToPath(new URL("../dist", import.meta.url))));
app.use((error, _req, res, _next) =>
  res.status(400).json({
    error:
      error.type === "entity.too.large"
        ? "The request is too large."
        : "Invalid request.",
  }),
);
const port = Number(process.env.PORT) || 3000;
app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`JD Assistant: http://localhost:${port}`),
);
