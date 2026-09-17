import { ChoiceApi } from "../domain/types";
import { FeatApi } from "../domain/types/feat.types";

export const ABILITY_SCORE_POINTS = 2;

export interface AbilityScoreIncrease {
  key: string;
  bonus: 1 | 2;
}

export interface CharacterAttributeValue {
  key: string;
  value: number;
}

export type LevelUpAbilityScoreResult =
  | { kind: "none" }
  | { kind: "increases"; increases: AbilityScoreIncrease[] }
  | { kind: "feat"; featId: string };

export function getOwnedFeatIds(personaje: {
  feats?: string[];
  dotes?: string[];
}): string[] {
  const feats = Array.isArray(personaje.feats) ? personaje.feats : [];
  const dotes = Array.isArray(personaje.dotes) ? personaje.dotes : [];
  return [...new Set([...feats, ...dotes].filter((id): id is string => Boolean(id)))];
}

export function featMeetsRequirements(
  feat: FeatApi,
  attributes: CharacterAttributeValue[]
): boolean {
  const requirements = feat.requirements?.attributes ?? [];
  if (requirements.length === 0) return true;

  const values = new Map(attributes.map(attribute => [attribute.key, attribute.value]));
  const checks = requirements.map(requirement => (values.get(requirement.key) ?? 0) >= requirement.min);

  if (feat.requirements?.attributeMode === "any") {
    return checks.some(Boolean);
  }

  return checks.every(Boolean);
}

export function filterLevelUpFeatChoices(
  feats: ChoiceApi<FeatApi> | undefined,
  ownedFeatIds: Iterable<string>,
  attributes: CharacterAttributeValue[]
): ChoiceApi<FeatApi> | undefined {
  if (!feats) return undefined;

  const owned = new Set(ownedFeatIds);
  return {
    ...feats,
    options: feats.options.filter(feat => !owned.has(feat.id) && featMeetsRequirements(feat, attributes))
  };
}

export function applyAbilityScoreIncreases(
  attributes: CharacterAttributeValue[],
  increases: AbilityScoreIncrease[]
): CharacterAttributeValue[] {
  const bonusByKey = new Map(increases.map(increase => [increase.key, increase.bonus]));
  return attributes.map(attribute => {
    const bonus = bonusByKey.get(attribute.key);
    if (!bonus) {
      return { key: attribute.key, value: attribute.value };
    }
    return { key: attribute.key, value: attribute.value + bonus };
  });
}

export function validateLevelUpAbilityScorePick(params: {
  abilityScoreGranted: boolean;
  increases?: AbilityScoreIncrease[];
  featId?: string;
  attributes: CharacterAttributeValue[];
  availableFeatIds: Iterable<string>;
  maxAttributeValue?: number;
}): { error: string } | LevelUpAbilityScoreResult {
  const { abilityScoreGranted, increases, featId, attributes, availableFeatIds, maxAttributeValue } = params;
  const hasIncreases = Boolean(increases && increases.length > 0);
  const hasFeat = Boolean(featId);

  if (!abilityScoreGranted) {
    if (hasIncreases || hasFeat) {
      return { error: "Este nivel no ofrece mejora de característica ni dote" };
    }
    return { kind: "none" };
  }

  if (hasIncreases && hasFeat) {
    return { error: "Debe elegir mejora de característica o dote, no ambas" };
  }

  if (!hasIncreases && !hasFeat) {
    return { error: "Debe enviar abilityScore o feat en un nivel con mejora de característica" };
  }

  if (featId) {
    const available = new Set(availableFeatIds);
    if (!available.has(featId)) {
      return { error: `La dote ${featId} no está entre las opciones disponibles` };
    }
    return { kind: "feat", featId };
  }

  return validateAbilityScoreIncreases(increases ?? [], attributes, maxAttributeValue);
}

function validateAbilityScoreIncreases(
  increases: AbilityScoreIncrease[],
  attributes: CharacterAttributeValue[],
  maxAttributeValue?: number
): { error: string } | { kind: "increases"; increases: AbilityScoreIncrease[] } {
  if (increases.length < 1 || increases.length > 2) {
    return { error: "abilityScore.increases debe tener 1 o 2 entradas" };
  }

  const seen = new Set<string>();
  const attributeMap = new Map(attributes.map(attribute => [attribute.key, attribute]));
  let total = 0;

  for (const increase of increases) {
    if (seen.has(increase.key)) {
      return { error: `La característica ${increase.key} está duplicada` };
    }
    seen.add(increase.key);

    if (increase.bonus !== 1 && increase.bonus !== 2) {
      return { error: "Cada bonus de característica debe ser 1 o 2" };
    }

    const attribute = attributeMap.get(increase.key);
    if (!attribute) {
      return { error: `El personaje no tiene la característica ${increase.key}` };
    }

    const nextValue = attribute.value + increase.bonus;
    if (maxAttributeValue !== undefined && nextValue > maxAttributeValue) {
      return { error: `${increase.key} no puede superar ${maxAttributeValue}` };
    }

    total += increase.bonus;
  }

  if (total !== ABILITY_SCORE_POINTS) {
    return { error: `La mejora de característica debe sumar ${ABILITY_SCORE_POINTS} puntos` };
  }

  return { kind: "increases", increases };
}
