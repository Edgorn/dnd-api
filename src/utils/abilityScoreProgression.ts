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
