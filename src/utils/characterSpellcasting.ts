import { AttributeApi, CharacterAttributeApi } from "../domain/types/attribute.types";
import {
  SpellcastingLevel,
  SpellcastingLevelSource,
} from "../domain/types/characterClass.types";
import { evaluateFormula } from "./formulaEvaluator";

export const DEFAULT_SPELL_SAVE_DC_FORMULA =
  "8 + @proficiencyBonus + @spellcasting.modifier";
export const DEFAULT_SPELL_ATTACK_BONUS_FORMULA =
  "@proficiencyBonus + @spellcasting.modifier";

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
