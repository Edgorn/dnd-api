import { ChoiceApi, ChoiceMongo } from "../domain/types";
import { AttributeApi, CharacterAttributeApi } from "../domain/types/attribute.types";
import {
  ClassSpellSlots,
  SpellcastingLevel,
  SpellcastingLevelSource,
  SpellPreparedFrom,
} from "../domain/types/characterClass.types";
import { evaluateFormula } from "./formulaEvaluator";

export const DEFAULT_SPELL_SAVE_DC_FORMULA =
  "8 + @proficiencyBonus + @spellcasting.modifier";
export const DEFAULT_SPELL_ATTACK_BONUS_FORMULA =
  "@proficiencyBonus + @spellcasting.modifier";

/**
 * Returns the spell slot / cantrip table for the highest class level
 * that is at or below the character's current level.
 */
export function resolveClassSpellSlotsForLevel(
  levels: { level: number; spellcasting?: ClassSpellSlots }[],
  characterLevel: number
): ClassSpellSlots | undefined {
  return levels
    .filter(lev => lev.level <= characterLevel && lev.spellcasting)
    .sort((a, b) => b.level - a.level)[0]?.spellcasting;
}

/** Latest `slots` table at or below the class level, even if a later row omits slots. */
export function resolveSpellSlotsTableForLevel(
  levels: { level: number; spellcasting?: ClassSpellSlots }[],
  characterLevel: number
): Record<string, number> | undefined {
  return levels
    .filter(lev => lev.level <= characterLevel && lev.spellcasting?.slots)
    .sort((a, b) => b.level - a.level)[0]?.spellcasting?.slots;
}

export function remainingCantripPicks(cap: number | undefined, ownedCount: number): number {
  if (cap === undefined || cap <= 0) return 0;
  return Math.max(0, cap - ownedCount);
}

function filterIncludesCantripLevel(filter?: Record<string, unknown>): boolean {
  if (!filter || filter.level === undefined) return false;
  if (filter.level === 0) return true;
  return Array.isArray(filter.level) && filter.level.includes(0);
}

export function hasCantripSpellChoice(
  choices?: Array<{
    level?: number;
    filter?: Record<string, unknown>;
    query_filter?: Record<string, unknown>;
  }>
): boolean {
  if (!choices?.length) return false;
  return choices.some(choice =>
    choice.level === 0
    || filterIncludesCantripLevel(choice.filter)
    || filterIncludesCantripLevel(choice.query_filter)
  );
}

export function buildCantripSpellChoice(classId: string, choose: number): ChoiceMongo {
  return {
    choose,
    filter: { level: 0, classes: classId },
  };
}

export function castableSpellLevels(slots?: Record<string, number>): number[] {
  if (!slots) return [];

  return Object.entries(slots)
    .map(([level, count]) => ({ level: Number(level), count }))
    .filter(({ level, count }) => Number.isInteger(level) && level >= 1 && level <= 9 && count > 0)
    .sort((a, b) => a.level - b.level)
    .map(({ level }) => level);
}

export function spellsLearnedAtLevel(
  levels: { level: number; spellcasting?: ClassSpellSlots }[],
  targetLevel: number
): number {
  const row = levels.find(level => level.level === targetLevel);
  const learned = row?.spellcasting?.spellsLearned;
  if (learned === undefined || learned <= 0) return 0;
  return learned;
}

type SpellChoiceLike = {
  level?: number;
  class?: string;
  filter?: Record<string, unknown>;
  query_filter?: Record<string, unknown>;
};

function filterIncludesLeveledSpell(filter?: Record<string, unknown>): boolean {
  if (!filter || filter.level === undefined) return false;
  if (typeof filter.level === "number") return filter.level >= 1;
  return Array.isArray(filter.level) && filter.level.some(level => typeof level === "number" && level >= 1);
}

function filterMatchesClass(filter: Record<string, unknown> | undefined, classId: string): boolean {
  if (!filter) return false;
  const classes = filter.classes ?? filter.class;
  if (classes === classId) return true;
  return Array.isArray(classes) && classes.includes(classId);
}

export function hasKnownSpellChoice(
  choices: SpellChoiceLike[] | undefined,
  classId: string
): boolean {
  if (!choices?.length || !classId) return false;

  return choices.some(choice => {
    if (choice.level !== undefined && choice.level >= 1 && choice.class === classId) {
      return true;
    }

    return (
      (filterIncludesLeveledSpell(choice.filter) && filterMatchesClass(choice.filter, classId))
      || (filterIncludesLeveledSpell(choice.query_filter) && filterMatchesClass(choice.query_filter, classId))
    );
  });
}

export function buildKnownSpellChoice(classId: string, choose: number, levels: number[]): ChoiceMongo {
  return {
    choose,
    filter: { level: levels, classes: classId },
  };
}

export function buildSynthesizedKnownSpellChoice(
  classId: string,
  levels: { level: number; spellcasting?: ClassSpellSlots }[],
  targetLevel: number,
  persistedChoices?: SpellChoiceLike[]
): ChoiceMongo | undefined {
  if (!classId) return undefined;

  const choose = spellsLearnedAtLevel(levels, targetLevel);
  if (choose <= 0) return undefined;

  if (hasKnownSpellChoice(persistedChoices, classId)) return undefined;

  const spellLevels = castableSpellLevels(resolveSpellSlotsTableForLevel(levels, targetLevel));
  if (!spellLevels.length) return undefined;

  return buildKnownSpellChoice(classId, choose, spellLevels);
}

export function excludeKnownSpellOptions<T extends { id?: string }>(
  choices: ChoiceApi<T>[],
  knownIds: Iterable<string>
): ChoiceApi<T>[] {
  const known = new Set(knownIds);
  return choices.map(choice => ({
    ...choice,
    options: choice.options.filter(opt => !opt.id || !known.has(opt.id)),
  }));
}

export interface LevelUpSpellChoicePick {
  choose: number;
  options: Array<{ id?: string }>;
}

export function validateLevelUpSpellPicks(
  choices: LevelUpSpellChoicePick[] | undefined,
  picks: string[][] | undefined,
  alreadyKnownIds: Iterable<string>
): { error: string } | { spellIds: string[] } {
  const choiceList = choices ?? [];
  const pickList = picks ?? [];
  const hasNonEmptyPicks = pickList.some(group => group.length > 0);

  if (choiceList.length === 0) {
    if (hasNonEmptyPicks) {
      return { error: "Este nivel no ofrece elecciones de conjuros" };
    }
    return { spellIds: [] };
  }

  if (pickList.length !== choiceList.length) {
    return { error: "Debe enviar una lista de conjuros por cada elección de spell_choices" };
  }

  const known = new Set(alreadyKnownIds);
  const seen = new Set<string>();
  const flattened: string[] = [];

  for (let i = 0; i < choiceList.length; i++) {
    const choice = choiceList[i];
    const group = pickList[i] ?? [];
    if (group.length !== choice.choose) {
      return { error: `La elección ${i + 1} requiere ${choice.choose} conjuro(s)` };
    }

    const optionIds = new Set(
      choice.options.map(opt => opt.id).filter((id): id is string => Boolean(id))
    );

    for (const id of group) {
      if (seen.has(id) || known.has(id)) {
        return { error: `El conjuro ${id} está duplicado o ya es conocido` };
      }
      if (!optionIds.has(id)) {
        return { error: `El conjuro ${id} no está entre las opciones de la elección ${i + 1}` };
      }
      seen.add(id);
      flattened.push(id);
    }
  }

  return { spellIds: flattened };
}

export function getPreparedSpellIds(
  preparedSpells: Record<string, string[]> | undefined,
  classId: string
): string[] {
  const ids = preparedSpells?.[classId];
  return Array.isArray(ids) ? ids : [];
}

export interface PreparedSpellPickInput {
  id: string;
  level: number;
  classIds: string[];
}

export function validatePreparedSpellPicks(params: {
  spellIds: string[];
  cap: number;
  preparedFrom: SpellPreparedFrom;
  knownIds: string[];
  classId: string;
  spells: PreparedSpellPickInput[];
  castableLevels: number[];
}): { error?: string } {
  const { spellIds, cap, preparedFrom, knownIds, classId, spells, castableLevels } = params;
  const seen = new Set<string>();
  const known = new Set(knownIds);
  const castable = new Set(castableLevels);
  const byId = new Map(spells.map(spell => [spell.id, spell]));

  if (spellIds.length > cap) {
    return { error: `No se pueden preparar más de ${cap} conjuros de esta clase` };
  }

  for (const id of spellIds) {
    if (seen.has(id)) {
      return { error: `El conjuro ${id} está duplicado` };
    }
    seen.add(id);

    const spell = byId.get(id);
    if (!spell) {
      return { error: `El conjuro ${id} no existe o no está disponible` };
    }
    if (spell.level === 0) {
      return { error: `Los trucos no se preparan (conjuro ${id})` };
    }
    if (!castable.has(spell.level)) {
      return { error: `El conjuro ${id} es de un nivel para el que esta clase no tiene ranuras` };
    }
    if (preparedFrom === "known" && !known.has(id)) {
      return { error: `El conjuro ${id} no está entre los conjuros conocidos de esta clase` };
    }
    if (preparedFrom === "classList" && !spell.classIds.includes(classId)) {
      return { error: `El conjuro ${id} no pertenece a la lista de esta clase` };
    }
  }

  return {};
}

export interface KnownSpellPickInput {
  id: string;
  level: number;
  classIds: string[];
}

export function validateKnownSpellPicks(params: {
  spellIds: string[];
  knownIds: string[];
  classId: string;
  spells: KnownSpellPickInput[];
  castableLevels: number[];
  cantripCap?: number;
  ownedCantripCount: number;
}): { error?: string } {
  const {
    spellIds,
    knownIds,
    classId,
    spells,
    castableLevels,
    cantripCap,
    ownedCantripCount,
  } = params;

  if (spellIds.length === 0) {
    return { error: "Debe indicar al menos un conjuro" };
  }

  const seen = new Set<string>();
  const known = new Set(knownIds);
  const castable = new Set(castableLevels);
  const byId = new Map(spells.map(spell => [spell.id, spell]));
  let newCantrips = 0;

  for (const id of spellIds) {
    if (seen.has(id)) {
      return { error: `El conjuro ${id} está duplicado` };
    }
    seen.add(id);

    if (known.has(id)) {
      return { error: `El conjuro ${id} ya es conocido` };
    }

    const spell = byId.get(id);
    if (!spell) {
      return { error: `El conjuro ${id} no existe o no está disponible` };
    }
    if (!spell.classIds.includes(classId)) {
      return { error: `El conjuro ${id} no pertenece a la lista de esta clase` };
    }
    if (spell.level === 0) {
      if (cantripCap === undefined || cantripCap <= 0) {
        return { error: "Esta clase no conoce trucos" };
      }
      newCantrips += 1;
    } else if (!castable.has(spell.level)) {
      return { error: `El conjuro ${id} es de un nivel para el que esta clase no tiene ranuras` };
    }
  }

  if (newCantrips > remainingCantripPicks(cantripCap, ownedCantripCount)) {
    return { error: `No se pueden conocer más de ${cantripCap} trucos de esta clase` };
  }

  return {};
}

/**
 * Builds a hydrated SpellcastingLevel for a character from class source data.
 */
export function buildSpellcastingLevel(
  source: SpellcastingLevelSource,
  ability: AttributeApi,
  characterAttributes: CharacterAttributeApi[],
  proficiencyBonus: number
): SpellcastingLevel {
  const charAttr = characterAttributes.find(a => a.key === ability.key);
  const spellcastingAttribute = {
    value: charAttr?.value ?? 10,
    modifier: charAttr?.modifier ?? Math.floor(((charAttr?.value ?? 10) - 10) / 2),
  };

  const variables = { proficiencyBonus };
  const classVariables = { level: source.classLevel ?? 0 };
  const formulaOptions = { spellcastingAttribute, classVariables };
  const saveFormula = source.spellSaveDcFormula?.trim()
    || DEFAULT_SPELL_SAVE_DC_FORMULA;
  const attackFormula = source.spellAttackBonusFormula?.trim()
    || DEFAULT_SPELL_ATTACK_BONUS_FORMULA;

  const preparedFormula = source.spellsPreparedFormula?.trim();
  const spellsPrepared = preparedFormula
    ? Math.max(0, Math.floor(evaluateFormula(
      preparedFormula,
      characterAttributes,
      variables,
      formulaOptions
    )))
    : undefined;

  return {
    class: source.class,
    ability,
    slots: source.slots,
    spellSaveDc: evaluateFormula(saveFormula, characterAttributes, variables, formulaOptions),
    spellAttackBonus: evaluateFormula(attackFormula, characterAttributes, variables, formulaOptions),
    ...(spellsPrepared !== undefined ? { spellsPrepared, preparedFrom: source.preparedFrom } : {}),
    ...(source.spellRepository ? { spellRepository: source.spellRepository } : {}),
  };
}
