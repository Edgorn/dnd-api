import { ChoiceApi } from "../domain/types";
import { FeatRequirements } from "../domain/types/feat.types";
import { CharacterAttributeValue, meetsAttributeRequirements } from "./characterLevelUpAbilityScore";

export function shouldEnforceMulticlassRequirements(
  ownedClassCount: number,
  isNewClass: boolean
): boolean {
  return isNewClass || ownedClassCount > 1;
}

export function characterMeetsAllClassRequirements(
  classesRequirements: Array<{ requirements?: FeatRequirements } | undefined>,
  attributes: CharacterAttributeValue[]
): boolean {
  return classesRequirements.every(item => meetsAttributeRequirements(item?.requirements, attributes));
}

export function unionUnique(base: string[] | undefined, extra: string[]): string[] {
  return [...new Set([...(base ?? []), ...extra].filter(Boolean))];
}

export function excludeOwnedChoiceOptions<T extends { id: string }>(
  choice: ChoiceApi<T> | undefined,
  ownedIds: Iterable<string>
): ChoiceApi<T> | undefined {
  if (!choice) return undefined;
  const owned = new Set(ownedIds);
  return {
    ...choice,
    options: choice.options.filter(option => !owned.has(option.id))
  };
}

export function validateChoicePicks(params: {
  choose: number;
  optionIds: Iterable<string>;
  picks: string[] | undefined;
  ownedIds: Iterable<string>;
  field: string;
}): { error: string } | { ids: string[] } {
  const { choose, field } = params;
  const optionIds = new Set(params.optionIds);
  const owned = new Set(params.ownedIds);
  const picks = params.picks ?? [];

  if (picks.length !== choose) {
    return { error: `${field} debe incluir exactamente ${choose} opciones` };
  }

  const seen = new Set<string>();
  for (const pick of picks) {
    if (seen.has(pick)) {
      return { error: `${field} contiene la opción duplicada ${pick}` };
    }
    seen.add(pick);
    if (owned.has(pick)) {
      return { error: `${field} incluye ${pick}, que el personaje ya posee` };
    }
    if (!optionIds.has(pick)) {
      return { error: `${pick} no está entre las opciones de ${field}` };
    }
  }

  return { ids: picks };
}

export function validateChoiceListPicks<T extends { id: string }>(params: {
  choices: ChoiceApi<T>[];
  picks: string[][] | undefined;
  ownedIds: Iterable<string>;
  field: string;
}): { error: string } | { ids: string[] } {
  const { choices, field } = params;
  const picks = params.picks ?? [];

  if (choices.length === 0) {
    if (picks.length > 0) {
      return { error: `${field} no aplica en esta subida` };
    }
    return { ids: [] };
  }

  if (picks.length !== choices.length) {
    return { error: `${field} debe alinearse con las elecciones disponibles` };
  }

  const collected: string[] = [];
  const owned = new Set(params.ownedIds);
  for (let index = 0; index < choices.length; index++) {
    const result = validateChoicePicks({
      choose: choices[index].choose,
      optionIds: choices[index].options.map(option => option.id),
      picks: picks[index],
      ownedIds: owned,
      field: `${field}[${index}]`
    });
    if ("error" in result) return result;
    for (const id of result.ids) owned.add(id);
    collected.push(...result.ids);
  }

  return { ids: collected };
}
