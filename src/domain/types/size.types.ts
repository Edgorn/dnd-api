export const CREATURE_SIZES = [
  "tiny",
  "small",
  "medium",
  "large",
  "huge",
  "gargantuan"
] as const;

export type CreatureSize = (typeof CREATURE_SIZES)[number];

const SIZE_ALIASES: Record<string, CreatureSize> = {
  tiny: "tiny",
  diminuto: "tiny",
  diminuta: "tiny",
  minusculo: "tiny",
  minuscula: "tiny",
  small: "small",
  pequeno: "small",
  pequena: "small",
  medium: "medium",
  mediano: "medium",
  mediana: "medium",
  large: "large",
  grande: "large",
  huge: "huge",
  enorme: "huge",
  gargantuan: "gargantuan",
  gargantua: "gargantuan",
  gargantuesco: "gargantuan",
  gargantuesca: "gargantuan"
};

function sizeKey(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeSize(value: unknown): CreatureSize | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return SIZE_ALIASES[sizeKey(value)] ?? null;
}

/** Canonical size when recognized; otherwise the original string so legacy values are not dropped. */
export function formatSize(value: unknown): CreatureSize | string {
  const normalized = normalizeSize(value);
  if (normalized) return normalized;
  return typeof value === "string" ? value : "";
}

/** True if `size` is at least `minSize`. Null when either value is not a known size. */
export function sizeMeetsMinimum(size: unknown, minSize: unknown): boolean | null {
  const actual = normalizeSize(size);
  const minimum = normalizeSize(minSize);
  if (!actual || !minimum) return null;
  return CREATURE_SIZES.indexOf(actual) >= CREATURE_SIZES.indexOf(minimum);
}
