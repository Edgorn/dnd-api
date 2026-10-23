import { ChoiceApi, ChoiceMongo } from "../domain/types";
import { AttributeApi, CharacterAttributeApi } from "../domain/types/attribute.types";
import {
  ClassSpellSlots,
  SpellcastingLevel,
  SpellcastingLevelSource,
  SpellPreparedFrom,
  SpellReplacementConfig,
  SpellRepositoryConfig,
  SpellRepositoryDestination,
  SpellRepositoryMaxLevel,
  SpellRepositorySource,
} from "../domain/types/characterClass.types";
import { SpellPrivilegeRule } from "../domain/types/traits.types";
import { CharacterSpellPrivilegeMongo } from "../domain/types/personajes.types";
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

export interface ClassSlotView {
  table: Record<string, number>;
  castableLevels: number[];
}

function hasSlotProgression(spellcasting?: ClassSpellSlots): boolean {
  return Boolean(spellcasting?.slots || spellcasting?.fixedLevelSlots);
}

function isSlotCountTable(
  value: ClassSpellSlots | Record<string, number>
): value is Record<string, number> {
  return !("slots" in value)
    && !("fixedLevelSlots" in value)
    && !("cantrips" in value)
    && !("spellsLearned" in value);
}

function tableCastableLevels(slots?: Record<string, number>): number[] {
  if (!slots) return [];

  return Object.entries(slots)
    .map(([level, count]) => ({ level: Number(level), count }))
    .filter(({ level, count }) => Number.isInteger(level) && level >= 1 && level <= 9 && count > 0)
    .sort((a, b) => a.level - b.level)
    .map(({ level }) => level);
}

/** Display table and learn/prepare levels for a class slot progression. */
export function resolveClassSlotView(spellcasting?: ClassSpellSlots): ClassSlotView {
  if (!spellcasting) {
    return { table: {}, castableLevels: [] };
  }

  if (spellcasting.fixedLevelSlots) {
    const { count, level } = spellcasting.fixedLevelSlots;
    if (count <= 0 || !Number.isInteger(level) || level < 1 || level > 9) {
      return { table: {}, castableLevels: [] };
    }

    const castableLevels: number[] = [];
    for (let spellLevel = 1; spellLevel <= level; spellLevel++) {
      castableLevels.push(spellLevel);
    }

    return {
      table: { [String(level)]: count },
      castableLevels,
    };
  }

  const table = spellcasting.slots ?? {};
  return { table, castableLevels: tableCastableLevels(table) };
}

/** Latest table or fixed-level progression at or below the class level. */
export function resolveSlotProgressionForLevel(
  levels: { level: number; spellcasting?: ClassSpellSlots }[],
  characterLevel: number
): ClassSpellSlots | undefined {
  const row = levels
    .filter(lev => lev.level <= characterLevel && hasSlotProgression(lev.spellcasting))
    .sort((a, b) => b.level - a.level)[0];

  if (row?.spellcasting?.fixedLevelSlots) {
    return { fixedLevelSlots: row.spellcasting.fixedLevelSlots };
  }
  if (row?.spellcasting?.slots) {
    return { slots: row.spellcasting.slots };
  }
  return undefined;
}

/** Latest display slot table at or below the class level, even if a later row omits slots. */
export function resolveSpellSlotsTableForLevel(
  levels: { level: number; spellcasting?: ClassSpellSlots }[],
  characterLevel: number
): Record<string, number> | undefined {
  const progression = resolveSlotProgressionForLevel(levels, characterLevel);
  if (!progression) return undefined;
  return resolveClassSlotView(progression).table;
}

export function mergeClassSpellSlots(
  row?: ClassSpellSlots,
  progression?: ClassSpellSlots
): ClassSpellSlots | undefined {
  if (!row && !progression) return undefined;
  return { ...row, ...progression };
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

function countsTowardKnownCap(choice: {
  countsTowardKnown?: boolean;
  source?: string;
}): boolean {
  if (choice.countsTowardKnown === false) return false;
  if (choice.source === "anyClassList") return false;
  return true;
}

export function hasCantripSpellChoice(
  choices?: Array<{
    level?: number;
    filter?: Record<string, unknown>;
    query_filter?: Record<string, unknown>;
    countsTowardKnown?: boolean;
    source?: string;
  }>
): boolean {
  if (!choices?.length) return false;
  return choices.some(choice =>
    countsTowardKnownCap(choice)
    && (
      choice.level === 0
      || filterIncludesCantripLevel(choice.filter)
      || filterIncludesCantripLevel(choice.query_filter)
    )
  );
}

export function buildCantripSpellChoice(classId: string, choose: number): ChoiceMongo {
  return {
    choose,
    filter: { level: 0, classes: classId },
  };
}

export function castableSpellLevels(
  slots?: ClassSpellSlots | Record<string, number>
): number[] {
  if (!slots) return [];
  if (isSlotCountTable(slots)) {
    return tableCastableLevels(slots);
  }
  return resolveClassSlotView(slots).castableLevels;
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
  countsTowardKnown?: boolean;
  source?: string;
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
    if (!countsTowardKnownCap(choice)) return false;

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

  const spellLevels = castableSpellLevels(resolveSlotProgressionForLevel(levels, targetLevel));
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

export function spellOnExpandedClassList(
  spell: { id: string; classIds: string[] },
  classId: string,
  extraIds?: Iterable<string>
): boolean {
  if (spell.classIds.includes(classId)) return true;
  if (!extraIds) return false;
  const extras = extraIds instanceof Set ? extraIds : new Set(extraIds);
  return extras.has(spell.id);
}

export function collectExpandedSpells<T extends { id?: string }>(
  subclasses: Array<{ expandedSpells?: T[] }>
): T[] {
  const seen = new Set<string>();
  const extras: T[] = [];
  for (const subclass of subclasses) {
    for (const spell of subclass.expandedSpells ?? []) {
      if (!spell.id || seen.has(spell.id)) continue;
      seen.add(spell.id);
      extras.push(spell);
    }
  }
  return extras;
}

function spellChoiceAllowedLevels(choice: {
  query_filter?: Record<string, string | number | boolean | (string | number)[]>;
  filter?: Record<string, string | number | boolean | (string | number)[]>;
}): number[] | undefined {
  const raw = choice.query_filter?.level ?? choice.filter?.level;
  if (typeof raw === "number") return [raw];
  if (Array.isArray(raw)) {
    return raw.filter((level): level is number => typeof level === "number");
  }
  return undefined;
}

export function mergeExpandedSpellsIntoChoice<T extends { id?: string; level: number }>(
  choice: ChoiceApi<T>,
  extras: T[]
): ChoiceApi<T> {
  if (!extras.length) return choice;
  const allowed = spellChoiceAllowedLevels(choice);
  if (allowed === undefined) return choice;

  const existing = new Set(
    choice.options.map(opt => opt.id).filter((id): id is string => Boolean(id))
  );
  const extra = extras.filter(spell =>
    Boolean(spell.id)
    && !existing.has(spell.id as string)
    && allowed.includes(spell.level)
  );
  if (!extra.length) return choice;
  return { ...choice, options: [...choice.options, ...extra] };
}

export function mergeExpandedSpellsIntoChoices<T extends { id?: string; level: number }>(
  choices: ChoiceApi<T>[] | undefined,
  extras: T[]
): ChoiceApi<T>[] | undefined {
  if (!choices?.length || !extras.length) return choices;
  return choices.map(choice => mergeExpandedSpellsIntoChoice(choice, extras));
}

export interface LevelUpSpellChoicePick {
  choose: number;
  options: Array<{ id?: string }>;
  countsTowardKnown?: boolean;
  source?: string;
}

export function validateLevelUpSpellPicks(
  choices: LevelUpSpellChoicePick[] | undefined,
  picks: string[][] | undefined,
  alreadyKnownIds: Iterable<string>
): { error: string } | { spellIds: string[]; extraSpellIds: string[] } {
  const choiceList = choices ?? [];
  const pickList = picks ?? [];
  const hasNonEmptyPicks = pickList.some(group => group.length > 0);

  if (choiceList.length === 0) {
    if (hasNonEmptyPicks) {
      return { error: "Este nivel no ofrece elecciones de conjuros" };
    }
    return { spellIds: [], extraSpellIds: [] };
  }

  if (pickList.length !== choiceList.length) {
    return { error: "Debe enviar una lista de conjuros por cada elección de spell_choices" };
  }

  const known = new Set(alreadyKnownIds);
  const seen = new Set<string>();
  const spellIds: string[] = [];
  const extraSpellIds: string[] = [];

  for (let i = 0; i < choiceList.length; i++) {
    const choice = choiceList[i];
    const group = pickList[i] ?? [];
    if (group.length !== choice.choose) {
      return { error: `La elección ${i + 1} requiere ${choice.choose} conjuro(s)` };
    }

    const optionIds = new Set(
      choice.options.map(opt => opt.id).filter((id): id is string => Boolean(id))
    );
    const extra = !countsTowardKnownCap(choice);

    for (const id of group) {
      if (seen.has(id) || known.has(id)) {
        return { error: "El conjuro está duplicado o ya es conocido" };
      }
      if (!optionIds.has(id)) {
        return { error: `El conjuro no está entre las opciones de la elección ${i + 1}` };
      }
      seen.add(id);
      if (extra) extraSpellIds.push(id);
      else spellIds.push(id);
    }
  }

  return { spellIds, extraSpellIds };
}

export interface SpellReplacementPick {
  from: string;
  to: string;
}

export interface SpellReplacementSpellInput {
  id: string;
  level: number;
}

export function shouldOfferSpellReplacement(params: {
  config?: SpellReplacementConfig | null;
  nextLevel: number;
  eligibleFromCount: number;
}): boolean {
  const { config, nextLevel, eligibleFromCount } = params;
  if (!config || config.count < 1) return false;
  if (nextLevel <= 1) return false;
  return eligibleFromCount > 0;
}

export function eligibleSpellReplacementFrom(
  known: SpellReplacementSpellInput[],
  includeCantrips: boolean
): SpellReplacementSpellInput[] {
  return known.filter(spell => {
    if (!spell.id) return false;
    if (spell.level === 0) return includeCantrips;
    return spell.level >= 1;
  });
}

export function buildSpellReplacementToChoice(
  classId: string,
  choose: number,
  castableLevels: number[],
  includeCantrips: boolean
): ChoiceMongo | undefined {
  if (!classId || choose < 1) return undefined;

  const levels = includeCantrips ? [0, ...castableLevels] : [...castableLevels];
  if (!levels.length) return undefined;

  return {
    choose,
    filter: { level: levels, classes: classId },
  };
}

export function validateSpellReplacements(params: {
  offered: boolean;
  count: number;
  includeCantrips: boolean;
  replacements: SpellReplacementPick[] | undefined;
  known: SpellReplacementSpellInput[];
  learnedIds: Iterable<string>;
  toOptionIds: Iterable<string>;
  toSpells: SpellReplacementSpellInput[];
}): { error: string } | { replacements: SpellReplacementPick[] } {
  const {
    offered,
    count,
    includeCantrips,
    replacements,
    known,
    learnedIds,
    toOptionIds,
    toSpells,
  } = params;
  const pickList = replacements ?? [];

  if (!offered) {
    if (pickList.length > 0) {
      return { error: "Este nivel no ofrece recambio de conjuros" };
    }
    return { replacements: [] };
  }

  if (pickList.length === 0) {
    return { replacements: [] };
  }

  if (pickList.length > count) {
    return { error: `No se pueden sustituir más de ${count} conjuro(s)` };
  }

  const eligible = eligibleSpellReplacementFrom(known, includeCantrips);
  const eligibleIds = new Set(eligible.map(spell => spell.id));
  const knownById = new Map(known.map(spell => [spell.id, spell]));
  const toById = new Map(toSpells.map(spell => [spell.id, spell]));
  const knownIds = new Set(known.map(spell => spell.id));
  const learned = new Set(learnedIds);
  const optionIds = new Set(toOptionIds);
  const seenFrom = new Set<string>();
  const seenTo = new Set<string>();

  for (const pick of pickList) {
    if (seenFrom.has(pick.from)) {
      return { error: "El conjuro está duplicado en el recambio" };
    }
    seenFrom.add(pick.from);

    if (!eligibleIds.has(pick.from)) {
      return { error: "El conjuro no se puede sustituir" };
    }

    if (seenTo.has(pick.to)) {
      return { error: "El conjuro está duplicado en el recambio" };
    }
    seenTo.add(pick.to);

    if (pick.from === pick.to) {
      return { error: "El conjuro no sustituye a otro distinto" };
    }
    if (knownIds.has(pick.to)) {
      return { error: "El conjuro ya es conocido" };
    }
    if (learned.has(pick.to)) {
      return { error: "El conjuro ya se aprende en esta subida" };
    }
    if (!optionIds.has(pick.to)) {
      return { error: "El conjuro no está entre las opciones de recambio" };
    }

    const fromSpell = knownById.get(pick.from);
    const toSpell = toById.get(pick.to);
    if (!fromSpell || !toSpell) {
      return { error: "El conjuro no existe o no está disponible" };
    }

    const fromIsCantrip = fromSpell.level === 0;
    const toIsCantrip = toSpell.level === 0;
    if (fromIsCantrip !== toIsCantrip) {
      return {
        error: fromIsCantrip
          ? "El truco solo se puede sustituir por otro truco"
          : "El conjuro solo se puede sustituir por otro conjuro con espacios",
      };
    }
    if (toIsCantrip && !includeCantrips) {
      return { error: "El conjuro no se puede sustituir por un truco" };
    }
  }

  return { replacements: pickList };
}

export function applySpellReplacements(
  knownIds: string[],
  replacements: SpellReplacementPick[],
  learnedIds: string[]
): string[] {
  const fromSet = new Set(replacements.map(pick => pick.from));
  const next = knownIds.filter(id => !fromSet.has(id));
  next.push(...replacements.map(pick => pick.to));
  next.push(...learnedIds);
  return next;
}

export function prunePreparedSpellIds(
  prepared: string[],
  removedIds: Iterable<string>
): string[] {
  const removed = new Set(removedIds);
  return prepared.filter(id => !removed.has(id));
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
  excludeFromCap?: Iterable<string>;
  extraClassSpellIds?: Iterable<string>;
}): { error?: string } {
  const { spellIds, cap, preparedFrom, knownIds, classId, spells, castableLevels, excludeFromCap, extraClassSpellIds } = params;
  const seen = new Set<string>();
  const known = new Set(knownIds);
  const castable = new Set(castableLevels);
  const byId = new Map(spells.map(spell => [spell.id, spell]));
  const excluded = new Set(excludeFromCap ?? []);
  const counting = spellIds.filter(id => !excluded.has(id));

  if (counting.length > cap) {
    return { error: `No se pueden preparar más de ${cap} conjuros de esta clase` };
  }

  for (const id of spellIds) {
    if (seen.has(id)) {
      return { error: "El conjuro está duplicado" };
    }
    seen.add(id);

    const spell = byId.get(id);
    if (!spell) {
      return { error: "El conjuro no existe o no está disponible" };
    }
    if (spell.level === 0) {
      return { error: "Los trucos no se preparan" };
    }
    if (!castable.has(spell.level)) {
      return { error: "El conjuro es de un nivel para el que esta clase no tiene ranuras" };
    }
    if (preparedFrom === "known" && !known.has(id)) {
      return { error: "El conjuro no está entre los conjuros conocidos de esta clase" };
    }
    if (preparedFrom === "classList" && !spellOnExpandedClassList(spell, classId, extraClassSpellIds)) {
      return { error: "El conjuro no pertenece a la lista de esta clase" };
    }
  }

  return {};
}

export function spellLevelMatchesFilter(level: number, filterLevel: number | number[]): boolean {
  if (typeof filterLevel === "number") return level === filterLevel;
  return Array.isArray(filterLevel) && filterLevel.includes(level);
}

export function characterHasTrait(
  characterTraitIds: Iterable<string>,
  traitKeys: Iterable<string>
): boolean {
  const owned = new Set(characterTraitIds);
  for (const key of traitKeys) {
    if (key && owned.has(key)) return true;
  }
  return false;
}

export function findSpellPrivilegeInstance(
  instances: CharacterSpellPrivilegeMongo[] | undefined,
  traitId: string,
  classId: string,
  extraTraitKeys: string[] = []
): CharacterSpellPrivilegeMongo | undefined {
  if (!instances?.length) return undefined;
  const keys = new Set([traitId, ...extraTraitKeys].filter(Boolean));
  return instances.find(item => item.classId === classId && keys.has(item.traitId));
}

export function privilegeRuleAtLevel(rule: { atLevel?: number } | undefined): number {
  return Number.isInteger(rule?.atLevel) && (rule?.atLevel ?? 0) >= 1 ? rule!.atLevel! : 1;
}

export function activeSpellPrivilegeRuleIndexes(
  rules: Array<{ atLevel?: number }>,
  classLevel: number
): number[] {
  return rules.flatMap((rule, index) => privilegeRuleAtLevel(rule) <= classLevel ? [index] : []);
}

export function alignPrivilegeSelections(
  rulesLength: number,
  activeIndexes: number[],
  compactSelections: string[][]
): string[][] {
  const aligned: string[][] = Array.from({ length: rulesLength }, () => []);
  activeIndexes.forEach((ruleIndex, compactIndex) => {
    aligned[ruleIndex] = [...(compactSelections[compactIndex] ?? [])];
  });
  return aligned;
}

function privilegeGroupUnchanged(existing: string[] | undefined, incoming: string[]): boolean {
  if (!existing?.length) return true;
  return existing.length === incoming.length && existing.every((id, index) => id === incoming[index]);
}

export function canReplaceSpellPrivileges(params: {
  rules: SpellPrivilegeRule[];
  classLevel?: number;
  existingSelections?: string[][];
  incomingSelections: string[][];
}): { error?: string } {
  const { rules, existingSelections, incomingSelections } = params;
  const classLevel = params.classLevel ?? Number.POSITIVE_INFINITY;
  const activeIndexes = activeSpellPrivilegeRuleIndexes(rules, classLevel);
  if (incomingSelections.length !== activeIndexes.length) {
    return { error: "Debe enviar una selección por cada regla de privilegio activa" };
  }

  for (let compactIndex = 0; compactIndex < activeIndexes.length; compactIndex++) {
    const ruleIndex = activeIndexes[compactIndex];
    const rule = rules[ruleIndex];
    const incoming = incomingSelections[compactIndex] ?? [];
    const existing = existingSelections?.[ruleIndex];
    if (privilegeGroupUnchanged(existing, incoming)) continue;
    if (!rule.replace) {
      return { error: "No se pueden cambiar los conjuros vinculados a este rasgo" };
    }
  }

  return {};
}

export interface SpellPrivilegePickInput {
  id: string;
  level: number;
  classIds: string[];
  ritual?: boolean;
}

export function validateSpellPrivilegePicks(params: {
  hasClass: boolean;
  hasTrait: boolean;
  rules: SpellPrivilegeRule[];
  selections: string[][];
  knownIds: string[];
  classId: string;
  spells: SpellPrivilegePickInput[];
  extraClassSpellIds?: Iterable<string>;
  classLevel?: number;
  existingSelections?: string[][];
}): { error?: string } {
  const {
    hasClass,
    hasTrait,
    rules,
    selections,
    knownIds,
    classId,
    spells,
    extraClassSpellIds,
    existingSelections
  } = params;
  const classLevel = params.classLevel ?? Number.POSITIVE_INFINITY;

  if (!hasClass) {
    return { error: "El personaje no tiene esa clase" };
  }
  if (!hasTrait) {
    return { error: "El personaje no tiene ese rasgo" };
  }
  if (!rules.length) {
    return { error: "Este rasgo no otorga privilegios de conjuro" };
  }

  const activeIndexes = activeSpellPrivilegeRuleIndexes(rules, classLevel);
  if (!activeIndexes.length) {
    return { error: "Ninguna regla de privilegio está desbloqueada a este nivel" };
  }
  if (selections.length !== activeIndexes.length) {
    return { error: "Debe enviar una selección por cada regla de privilegio activa" };
  }

  const replaceCheck = canReplaceSpellPrivileges({
    rules,
    classLevel,
    existingSelections,
    incomingSelections: selections
  });
  if (replaceCheck.error) return replaceCheck;

  const known = new Set(knownIds);
  const byId = new Map(spells.map(spell => [spell.id, spell]));
  const across = new Set<string>();

  for (let compactIndex = 0; compactIndex < activeIndexes.length; compactIndex++) {
    const ruleIndex = activeIndexes[compactIndex];
    const rule = rules[ruleIndex];
    const group = selections[compactIndex] ?? [];
    if (group.length !== rule.choose) {
      return { error: `La regla ${ruleIndex + 1} requiere ${rule.choose} conjuro(s)` };
    }

    const inGroup = new Set<string>();
    for (const id of group) {
      if (inGroup.has(id) || across.has(id)) {
        return { error: "El conjuro está duplicado" };
      }
      inGroup.add(id);
      across.add(id);

      const spell = byId.get(id);
      if (!spell) {
        return { error: "El conjuro no existe o no está disponible" };
      }
      if (!spellLevelMatchesFilter(spell.level, rule.filter.level)) {
        return { error: `El conjuro no coincide con el nivel de la regla ${ruleIndex + 1}` };
      }
      if (rule.filter.ritual !== undefined && Boolean(spell.ritual) !== rule.filter.ritual) {
        return { error: rule.filter.ritual
          ? "El conjuro debe ser un ritual"
          : "El conjuro no puede ser un ritual" };
      }
      if (rule.source === "anyClassList") {
        if (!spell.classIds.length) {
          return { error: "El conjuro no pertenece a ninguna lista de clase" };
        }
      } else if (!spellOnExpandedClassList(spell, classId, extraClassSpellIds)) {
        return { error: "El conjuro no pertenece a la lista de esta clase" };
      }
      if (rule.source === "known" && !known.has(id)) {
        return { error: "El conjuro no está entre los conjuros conocidos de esta clase" };
      }
    }
  }

  return {};
}

function privilegeClassLevel(
  classLevelByClassId: Map<string, number> | undefined,
  classId: string,
  fallback?: number
): number {
  const fromMap = classLevelByClassId?.get(classId);
  if (typeof fromMap === "number") return fromMap;
  if (typeof fallback === "number") return fallback;
  return Number.POSITIVE_INFINITY;
}

export function privilegeSpellIdsExcludedFromCap(
  instances: CharacterSpellPrivilegeMongo[] | undefined,
  rulesByTraitId: Map<string, SpellPrivilegeRule[]>,
  classId?: string,
  classLevelByClassId?: Map<string, number>
): Set<string> {
  const excluded = new Set<string>();
  if (!instances?.length) return excluded;

  for (const instance of instances) {
    if (classId && instance.classId !== classId) continue;
    const rules = rulesByTraitId.get(instance.traitId) ?? [];
    const classLevel = privilegeClassLevel(classLevelByClassId, instance.classId);
    const active = new Set(activeSpellPrivilegeRuleIndexes(rules, classLevel));
    for (let i = 0; i < rules.length; i++) {
      if (!active.has(i) || rules[i].countsTowardPreparedCap) continue;
      for (const id of instance.selections[i] ?? []) {
        if (id) excluded.add(id);
      }
    }
  }

  return excluded;
}

export function extraPrivilegeSpellIds(
  instances: CharacterSpellPrivilegeMongo[] | undefined,
  rulesByTraitId: Map<string, SpellPrivilegeRule[]>,
  classId: string,
  classLevelByClassId?: Map<string, number>,
  excludeTraitIds?: Iterable<string>
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const excluded = new Set(excludeTraitIds ?? []);
  if (!instances?.length) return ids;

  for (const instance of instances) {
    if (instance.classId !== classId) continue;
    if (excluded.has(instance.traitId)) continue;
    const rules = rulesByTraitId.get(instance.traitId) ?? [];
    const classLevel = privilegeClassLevel(classLevelByClassId, instance.classId);
    const active = new Set(activeSpellPrivilegeRuleIndexes(rules, classLevel));
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (!active.has(i) || rule.alwaysPrepared || rule.countsTowardPreparedCap) continue;
      for (const id of instance.selections[i] ?? []) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
}

export function alwaysPreparedSpellIds(
  instances: CharacterSpellPrivilegeMongo[] | undefined,
  rulesByTraitId: Map<string, SpellPrivilegeRule[]>,
  classId: string,
  classLevelByClassId?: Map<string, number>
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  if (!instances?.length) return ids;

  for (const instance of instances) {
    if (instance.classId !== classId) continue;
    const rules = rulesByTraitId.get(instance.traitId) ?? [];
    const classLevel = privilegeClassLevel(classLevelByClassId, instance.classId);
    const active = new Set(activeSpellPrivilegeRuleIndexes(rules, classLevel));
    for (let i = 0; i < rules.length; i++) {
      if (!active.has(i) || !rules[i].alwaysPrepared) continue;
      for (const id of instance.selections[i] ?? []) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
}

export function mergePreparedWithPrivileges(
  preparedIds: string[],
  alwaysPreparedIds: string[]
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of [...preparedIds, ...alwaysPreparedIds]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged;
}

export function getCharacterSpellPrivileges(
  raw: CharacterSpellPrivilegeMongo[] | undefined
): CharacterSpellPrivilegeMongo[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(item =>
    Boolean(item)
    && typeof item.traitId === "string"
    && typeof item.classId === "string"
    && Array.isArray(item.selections)
  );
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
  extraClassSpellIds?: Iterable<string>;
}): { error?: string } {
  const {
    spellIds,
    knownIds,
    classId,
    spells,
    castableLevels,
    cantripCap,
    ownedCantripCount,
    extraClassSpellIds,
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
      return { error: "El conjuro está duplicado" };
    }
    seen.add(id);

    if (known.has(id)) {
      return { error: "El conjuro ya es conocido" };
    }

    const spell = byId.get(id);
    if (!spell) {
      return { error: "El conjuro no existe o no está disponible" };
    }
    if (!spellOnExpandedClassList(spell, classId, extraClassSpellIds)) {
      return { error: "El conjuro no pertenece a la lista de esta clase" };
    }
    if (spell.level === 0) {
      if (cantripCap === undefined || cantripCap <= 0) {
        return { error: "Esta clase no conoce trucos" };
      }
      newCantrips += 1;
    } else if (!castable.has(spell.level)) {
      return { error: "El conjuro es de un nivel para el que esta clase no tiene ranuras" };
    }
  }

  if (newCantrips > remainingCantripPicks(cantripCap, ownedCantripCount)) {
    return { error: `No se pueden conocer más de ${cantripCap} trucos de esta clase` };
  }

  return {};
}

export interface ResolvedSpellRepositoryCopyRules {
  source: SpellRepositorySource;
  destination: SpellRepositoryDestination;
  ritualOnly: boolean;
  maxLevel: SpellRepositoryMaxLevel;
  includesCantrips: boolean;
  equipmentId?: string;
}

export function resolveSpellRepositoryCopyRules(
  config: SpellRepositoryConfig
): ResolvedSpellRepositoryCopyRules {
  return {
    source: config.source ?? "classList",
    destination: config.destination ?? "known",
    ritualOnly: config.ritualOnly ?? false,
    maxLevel: config.maxLevel ?? "castable",
    includesCantrips: config.includesCantrips,
    ...(config.equipmentId ? { equipmentId: config.equipmentId } : {}),
  };
}

export function halfClassLevelCeil(classLevel: number): number {
  return Math.max(0, Math.ceil(classLevel / 2));
}

export interface CopiedSpellPickInput {
  id: string;
  level: number;
  classIds: string[];
  ritual?: boolean;
}

export function validateCopiedSpellPicks(params: {
  spellIds: string[];
  ownedIds: string[];
  classId: string;
  spells: CopiedSpellPickInput[];
  source: SpellRepositorySource;
  ritualOnly: boolean;
  includesCantrips: boolean;
  maxLevel: SpellRepositoryMaxLevel;
  classLevel: number;
  castableLevels: number[];
  extraClassSpellIds?: Iterable<string>;
}): { error?: string } {
  const {
    spellIds,
    ownedIds,
    classId,
    spells,
    source,
    ritualOnly,
    includesCantrips,
    maxLevel,
    classLevel,
    castableLevels,
    extraClassSpellIds,
  } = params;

  if (spellIds.length === 0) {
    return { error: "Debe indicar al menos un conjuro" };
  }

  const seen = new Set<string>();
  const owned = new Set(ownedIds);
  const castable = new Set(castableLevels);
  const byId = new Map(spells.map(spell => [spell.id, spell]));
  const halfCap = halfClassLevelCeil(classLevel);

  for (const id of spellIds) {
    if (seen.has(id)) {
      return { error: "El conjuro está duplicado" };
    }
    seen.add(id);

    if (owned.has(id)) {
      return { error: "El conjuro ya está en el repositorio" };
    }

    const spell = byId.get(id);
    if (!spell) {
      return { error: "El conjuro no existe o no está disponible" };
    }
    if (ritualOnly && spell.ritual !== true) {
      return { error: "El conjuro debe ser un ritual" };
    }
    if (source === "anyClassList") {
      if (!spell.classIds.length) {
        return { error: "El conjuro no pertenece a ninguna lista de clase" };
      }
    } else if (!spellOnExpandedClassList(spell, classId, extraClassSpellIds)) {
      return { error: "El conjuro no pertenece a la lista de esta clase" };
    }
    if (spell.level === 0) {
      if (!includesCantrips) {
        return { error: "Este repositorio no admite trucos" };
      }
    } else if (maxLevel === "halfClassLevelCeil") {
      if (spell.level > halfCap) {
        return { error: "El conjuro supera la mitad del nivel de clase" };
      }
    } else if (!castable.has(spell.level)) {
      return { error: "El conjuro es de un nivel para el que esta clase no tiene ranuras" };
    }
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

  const sourceSlots = source.slots;
  const projectedSlots = sourceSlots?.fixedLevelSlots && !sourceSlots.slots
    ? { ...sourceSlots, slots: resolveClassSlotView(sourceSlots).table }
    : sourceSlots;

  return {
    class: source.class,
    ability,
    slots: projectedSlots,
    spellSaveDc: evaluateFormula(saveFormula, characterAttributes, variables, formulaOptions),
    spellAttackBonus: evaluateFormula(attackFormula, characterAttributes, variables, formulaOptions),
    ...(spellsPrepared !== undefined ? { spellsPrepared, preparedFrom: source.preparedFrom } : {}),
    ...(source.spellRepository ? { spellRepository: source.spellRepository } : {}),
  };
}
