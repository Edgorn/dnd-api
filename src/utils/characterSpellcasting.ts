import { ChoiceApi, ChoiceMongo } from "../domain/types";
import { AttributeApi, CharacterAttributeApi } from "../domain/types/attribute.types";
import {
  ClassSpellSlots,
  SpellcastingLevel,
  SpellcastingLevelSource,
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
  const saveFormula = source.spellSaveDcFormula?.trim()
    || DEFAULT_SPELL_SAVE_DC_FORMULA;
  const attackFormula = source.spellAttackBonusFormula?.trim()
    || DEFAULT_SPELL_ATTACK_BONUS_FORMULA;

  return {
    class: source.class,
    ability,
    slots: source.slots,
    spellSaveDc: evaluateFormula(saveFormula, characterAttributes, variables, {
      spellcastingAttribute,
    }),
    spellAttackBonus: evaluateFormula(attackFormula, characterAttributes, variables, {
      spellcastingAttribute,
    }),
  };
}
