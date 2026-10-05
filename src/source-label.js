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

const sectionNames = {
  "position overview": "Position overview",
  "role overview": "Position overview",
  "job overview": "Position overview",
  overview: "Position overview",
  "about the role": "About the role",
  "job title": "Job title",
  "key responsibilities": "Responsibilities",
  responsibilities: "Responsibilities",
  "what you'll do": "Responsibilities",
  skills: "Skills",
  "required skills": "Skills",
  "technical skills": "Skills",
  requirements: "Requirements",
  qualifications: "Qualifications",
  "required qualifications": "Qualifications",
  "preferred qualifications": "Preferred qualifications",
  experience: "Experience",
  location: "Location",
  department: "Department",
  "employment type": "Employment type",
  benefits: "Benefits",
  salary: "Salary",
  "about us": "About us",
  "about the company": "About the company",
  "how to apply": "How to apply",
};
function headingText(text) {
  return text
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/:$/, "")
    .trim()
    .toLowerCase();
}
export function groupSourceLines(lines) {
  const groups = [];
  let active = null;
  lines.forEach((text, index) => {
    const line = index + 1;
    const heading = sectionNames[headingText(text)];
    if (heading) {
      active = {
        label: heading,
        headingLine: line,
        headingText: text,
        points: [],
      };
      groups.push(active);
      return;
    }
    const prefix = text.match(
      /^\s*[-•]?\s*(job title|title|location|department|work arrangement|experience|skills|requirements|responsibilities|salary|benefits|employment type|qualifications)\s*:\s*/i,
    );
    if (prefix) {
      const key = prefix[1].toLowerCase();
      const label =
        key === "title"
          ? "Job title"
          : key.replace(/^\w/, (c) => c.toUpperCase());
      groups.push({
        label,
        points: [
          { text, line, displayText: text.slice(prefix[0].length) || text },
        ],
      });
      active = null;
      return;
    }
    if (active) {
      active.points.push({
        text,
        line,
        displayText: text.replace(/^[-•]\s*/, ""),
      });
      return;
    }
    const label = index === 0 ? "Job title" : sourceLabel(text, index);
    let group = groups.find((g) => g.label === label && !g.headingLine);
    if (!group) {
      group = { label, points: [] };
      groups.push(group);
    }
    group.points.push({
      text,
      line,
      displayText: text.replace(/^[-•]\s*/, ""),
    });
  });
  return groups;
}
