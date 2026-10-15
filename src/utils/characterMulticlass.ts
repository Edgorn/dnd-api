import { ChoiceApi } from "../domain/types";
import { FeatRequirements } from "../domain/types/feat.types";
import { LevelSkillProficiencyChoice } from "../domain/types/classLevelChoices.types";
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

export function mergeSkillProficiencyChoices(
  ...choices: Array<LevelSkillProficiencyChoice | undefined>
): LevelSkillProficiencyChoice[] {
  const merged = new Map<string, LevelSkillProficiencyChoice>();

  for (const choice of choices) {
    if (!choice) continue;
    const key = `${choice.from}:${choice.value}`;
    const current = merged.get(key);
    if (current) {
      merged.set(key, { ...current, choose: current.choose + choice.choose });
    } else {
      merged.set(key, { ...choice });
    }
  }

  return [...merged.values()];
}

export function mergeSkillChoices<T extends { id: string }>(
  ...choices: Array<ChoiceApi<T> | undefined>
): ChoiceApi<T> | undefined {
  const present = choices.filter((choice): choice is ChoiceApi<T> => Boolean(choice));
  if (!present.length) return undefined;
  if (present.length === 1) return present[0];

  const byId = new Map<string, T>();
  let choose = 0;
  let hasAll = false;
  let hasFilter = false;
  const filters: Array<NonNullable<ChoiceApi<T>["query_filter"]>> = [];

  for (const choice of present) {
    choose += choice.choose;
    if (choice.query_type === "all") hasAll = true;
    if (choice.query_type === "filter") {
      hasFilter = true;
      if (choice.query_filter) filters.push(choice.query_filter);
    }
    for (const option of choice.options) {
      if (option.id) byId.set(option.id, option);
    }
  }

  const query_type: ChoiceApi<T>["query_type"] = hasAll ? "all" : hasFilter ? "filter" : "options";
  return {
    choose,
    options: [...byId.values()],
    query_type,
    ...(query_type === "filter" && filters.length === 1 ? { query_filter: filters[0] } : {})
  };
}

export function resolveLevelSkillPicks<T extends { id: string }>(params: {
  dipChoice?: ChoiceApi<T>;
  levelChoice?: ChoiceApi<T>;
  ownedIds: Iterable<string>;
  picks?: string[];
}): { error: string } | { ids: string[] } {
  const merged = mergeSkillChoices(params.dipChoice, params.levelChoice);
  const trimmed = excludeOwnedChoiceOptions(merged, params.ownedIds);
  if (!trimmed) {
    if (params.picks?.length) {
      return { error: "skillPicks no aplica en esta subida" };
    }
    return { ids: [] };
  }

  return validateChoicePicks({
    choose: trimmed.choose,
    optionIds: trimmed.options.map(option => option.id),
    picks: params.picks,
    ownedIds: params.ownedIds,
    field: "skillPicks"
  });
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
