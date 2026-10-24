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
  | { kind: "option"; optionId: string };

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
  alternativeOffered?: boolean;
  increases?: AbilityScoreIncrease[];
  optionId?: string;
  attributes: CharacterAttributeValue[];
  maxAttributeValue?: number;
  bonusByKey?: Record<string, number>;
  maxByKey?: Record<string, number>;
}): { error: string } | LevelUpAbilityScoreResult {
  const {
    abilityScoreGranted,
    alternativeOffered = false,
    increases,
    optionId,
    attributes,
    maxAttributeValue,
    bonusByKey,
    maxByKey
  } = params;
  const hasIncreases = Boolean(increases && increases.length > 0);
  const hasOption = Boolean(optionId);

  if (!abilityScoreGranted) {
    if (hasIncreases || hasOption) {
      return { error: "Este nivel no ofrece mejora de característica ni alternativa" };
    }
    return { kind: "none" };
  }

  if (hasIncreases && hasOption) {
    return { error: "Debe elegir mejora de característica o una opción, no ambas" };
  }

  if (!hasIncreases && !hasOption) {
    return {
      error: alternativeOffered
        ? "Debe enviar abilityScore o abilityScoreOption en un nivel con mejora de característica"
        : "Debe enviar abilityScore en un nivel con mejora de característica"
    };
  }

  if (optionId) {
    if (!alternativeOffered) {
      return { error: "Este nivel no ofrece una alternativa a la mejora de característica" };
    }
    return { kind: "option", optionId };
  }

  return validateAbilityScoreIncreases(
    increases ?? [],
    attributes,
    maxAttributeValue,
    bonusByKey,
    maxByKey
  );
}

function validateAbilityScoreIncreases(
  increases: AbilityScoreIncrease[],
  attributes: CharacterAttributeValue[],
  maxAttributeValue?: number,
  bonusByKey: Record<string, number> = {},
  maxByKey: Record<string, number> = {}
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

    const nextValue = attribute.value + increase.bonus + (bonusByKey[increase.key] ?? 0);
    const cap = maxByKey[increase.key] ?? maxAttributeValue;
    if (cap !== undefined && nextValue > cap) {
      return { error: `${increase.key} no puede superar ${cap}` };
    }

    total += increase.bonus;
  }

  if (total !== ABILITY_SCORE_POINTS) {
    return { error: `La mejora de característica debe sumar ${ABILITY_SCORE_POINTS} puntos` };
  }

  return { kind: "increases", increases };
}
