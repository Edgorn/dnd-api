import { TraitAbilityScore } from "../domain/types/traits.types";

export interface AbilityScoreValue {
  key: string;
  value: number;
}

export interface TraitAbilityScoreSource {
  abilityScores?: TraitAbilityScore[];
}

export interface AppliedTraitAbilityScores<T extends AbilityScoreValue> {
  attributes: T[];
  bonusByKey: Record<string, number>;
  maxByKey: Record<string, number>;
}

export function collectTraitAbilityScores(
  traits: TraitAbilityScoreSource[] | undefined
): { bonusByKey: Record<string, number>; maxByKey: Record<string, number> } {
  const bonusByKey: Record<string, number> = {};
  const maxByKey: Record<string, number> = {};

  for (const trait of traits ?? []) {
    for (const score of trait.abilityScores ?? []) {
      bonusByKey[score.key] = (bonusByKey[score.key] ?? 0) + score.bonus;
      if (score.max !== undefined) {
        const current = maxByKey[score.key];
        if (current === undefined || score.max > current) {
          maxByKey[score.key] = score.max;
        }
      }
    }
  }

  return { bonusByKey, maxByKey };
}

export function applyTraitAbilityScores<T extends AbilityScoreValue>(
  attributes: T[] | undefined,
  traits: TraitAbilityScoreSource[] | undefined
): AppliedTraitAbilityScores<T> {
  const { bonusByKey, maxByKey } = collectTraitAbilityScores(traits);

  return {
    bonusByKey,
    maxByKey,
    attributes: (attributes ?? []).map(attribute => {
      const bonus = bonusByKey[attribute.key] ?? 0;
      let value = attribute.value + bonus;
      const max = maxByKey[attribute.key];
      if (max !== undefined && value > max) {
        value = max;
      }
      return { key: attribute.key, value } as T;
    })
  };
}

export function effectiveAttributeMax(
  key: string,
  maxByKey: Record<string, number>,
  defaultMax?: number
): number | undefined {
  return maxByKey[key] ?? defaultMax;
}

export function withAttributeMax<T extends { key: string }>(
  attributes: T[],
  maxByKey: Record<string, number>,
  defaultMax?: number
): (T & { max?: number })[] {
  return attributes.map(attribute => {
    const max = effectiveAttributeMax(attribute.key, maxByKey, defaultMax);
    if (max === undefined) return attribute;
    return { ...attribute, max };
  });
}
