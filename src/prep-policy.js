// Count meaningful content, not blank lines. Both the UI and server use this policy.
export function prepBudget(text) {
  const normalized = String(text).trim();
  const words = normalized.split(/\s+/).filter(Boolean).length;
  const lines = normalized.split(/\r?\n/).filter((line) => line.trim()).length;
  return words >= 500 || lines >= 20
    ? 15
    : words >= 220 || lines >= 12
      ? 10
      : 6;
}
