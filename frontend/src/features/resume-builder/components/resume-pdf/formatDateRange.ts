export function formatDateRange(
  start: string,
  end: string,
  isCurrent: boolean,
): string {
  const parts = [start, isCurrent ? "Present" : end].filter(Boolean);
  return parts.join(" – "); // en dash
}
