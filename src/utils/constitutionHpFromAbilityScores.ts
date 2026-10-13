export interface ConstitutionModifierSource {
  key: string;
  modifier?: number;
}

export function constitutionModifier(
  attributes: ConstitutionModifierSource[] | undefined
): number {
  return attributes?.find(attribute => attribute.key === "con")?.modifier ?? 0;
}

export function constitutionHitPointDelta(params: {
  before: ConstitutionModifierSource[] | undefined;
  after: ConstitutionModifierSource[] | undefined;
  previousLevels: number;
}): number {
  if (params.previousLevels <= 0) return 0;
  return (constitutionModifier(params.after) - constitutionModifier(params.before))
    * params.previousLevels;
}
