# Submit JD Assistant

The assignment accepts a GitHub repository OR a deployed link, plus a short README and a 2–4 minute screen recording. The source package includes README.md. Use the repository route to finish without a deployment step.

## GitHub repository

1. Sign in to GitHub and create a repository named jd-assistant. For a private repository, give the reviewers access according to your company's instructions.
2. Upload the contents of the clean jd-assistant-submission folder. The repository root should contain package.json, README.md, src, server and tests. Do not upload the ZIP as the only repository file.
3. Commit the files. .env.example is safe and contains blank keys. .env, node_modules and dist must stay out of the repository.
4. Confirm the README shows and the files can be viewed by the reviewer. Follow the README setup in a fresh folder if possible; reviewers supply their own key.
5. Submit the repository URL with the Loom URL. A localhost URL only works on your computer and is not a deployed link.

## Loom without recording the script

Recommended: use Loom's desktop app on Windows 10+.

1. Open the running app in a normal browser at http://localhost:3000.
2. Open Loom, select Screen Only and enable your microphone. Select the project browser window for the demo.
3. Open Speaker notes in Loom and paste the spoken parts from WALKTHROUGH.md. Scroll the notes as needed. Loom's own speaker notes are excluded from the finished recording.
4. Make a 10-second trial. Say one sentence, scroll your notes and stop. Watch it to confirm sound, readable app text and invisible notes.
5. Record the 2–4 minute walkthrough. Show JD input/import, a cited answer, a missing-fact answer, prep with reasons, and optional resume weak spots. Briefly explain shared grounding, server-only keys and exact citation checks. Mention AI assistance and practical limits accurately.
6. Watch the final video. Check duration, audio and absence of secrets. Copy its share link and ensure the manager can access it.

If using the Chrome extension instead, choose Current Tab for the app and keep the script in a separate window or on your phone. Do not choose full-screen capture when reading a visible ordinary notes window.

Official references: https://support.atlassian.com/loom/docs/use-speaker-notes/ and https://support.atlassian.com/loom/docs/get-started-with-the-loom-chrome-extension/

## Before sending

- Repository access works; README is at its root.
- No API keys, personal resumes or .env appear in repository or video.
- Video is 2–4 minutes and both features plus the bonus are demonstrated.
- Test evidence is in TEST_REPORT.md, TEST_RESULTS.json and OPTIONAL_TEST_RESULTS.json. Do not claim exhaustive correctness.
- Confirm the company's EOD timezone and submission destination.
- Send repository and Loom links using the channel the company requested.

For Monday's code review, study INTERVIEW_GUIDE.md and trace one request yourself from React through the server and back. Practice explaining why exact quotes help but cannot prove the answer's reasoning.
