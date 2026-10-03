// Presentation labels only: the original source sentence is never rewritten.
export function sourceLabel(text, index) {
  if (index === 0) return null;
  const explicit = text.match(
    /^\s*[-•]?\s*(location|work arrangement|experience|skills|requirements|responsibilities|salary|benefits|employment type|qualifications)\s*:/i,
  );
  if (explicit)
    return explicit[1].toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  if (/\b(years? of .*experience|\d+\+? years?|experience:)\b/i.test(text))
    return "Experience";
  if (/\b(required|requirements|proficiency|familiarity)\b/i.test(text))
    return "Skills";
  if (
    /\b(react|typescript|python|java|sql|llm|postgresql|kubernetes|terraform|figma|power bi|aws)\b/i.test(
      text,
    )
  )
    return "Skills & responsibilities";
  if (/\b(remote|hybrid|on-site|office days)\b/i.test(text))
    return "Work arrangement";
  return "Responsibilities";
}
