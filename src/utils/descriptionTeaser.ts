export function descriptionTeaser(description: string[] | undefined, maxChars = 200): string | undefined {
  const first = description?.find(paragraph => typeof paragraph === "string" && paragraph.trim().length > 0)?.trim();
  if (!first) return undefined;
  if (first.length <= maxChars) return first;
  return `${first.slice(0, maxChars).trimEnd()}…`;
}
