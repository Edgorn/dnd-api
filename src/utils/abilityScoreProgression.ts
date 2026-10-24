export function resolveAbilityScoreProgression(
  classOverride?: number[] | null,
  systemDefault?: number[]
): number[] | undefined {
  if (Array.isArray(classOverride)) {
    return classOverride;
  }
  if (Array.isArray(systemDefault)) {
    return systemDefault;
  }
  return undefined;
}

export function hasAbilityScoreAtLevel(
  level: number,
  resolved?: number[],
  legacyFlag?: boolean
): boolean {
  if (resolved !== undefined) {
    return resolved.includes(level);
  }
  return Boolean(legacyFlag);
}

export function resolveAbilityScoreAlternativeGroupId(
  classOverride?: string | null,
  systemDefault?: string
): string | undefined {
  if (classOverride === null || classOverride === "") {
    return undefined;
  }
  if (typeof classOverride === "string") {
    return classOverride;
  }
  if (typeof systemDefault === "string" && systemDefault.length > 0) {
    return systemDefault;
  }
  return undefined;
}
