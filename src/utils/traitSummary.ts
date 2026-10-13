export function storedSummary(summary?: string[] | null): string[] {
  return Array.isArray(summary) ? [...summary] : [];
}

export function displaySummary(summary?: string[] | null, description?: string[] | null): string[] {
  const stored = storedSummary(summary);
  if (stored.length > 0) return stored;
  return Array.isArray(description) ? [...description] : [];
}

function stringArraysEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function summaryToPersist(summary?: string[] | null, description?: string[] | null): string[] {
  const stored = storedSummary(summary);
  const desc = Array.isArray(description) ? description : [];
  if (stored.length === 0) return stored;
  if (stringArraysEqual(stored, desc)) return [];
  return stored;
}
