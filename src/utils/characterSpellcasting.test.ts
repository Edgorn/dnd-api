import { describe, it, expect } from "vitest";
import {
  buildSpellcastingLevel,
  DEFAULT_SPELL_ATTACK_BONUS_FORMULA,
  DEFAULT_SPELL_SAVE_DC_FORMULA,
} from "./characterSpellcasting";
import { AttributeApi, CharacterAttributeApi } from "../domain/types/attribute.types";
import { SpellcastingLevelSource } from "../domain/types/characterClass.types";

const intAbility: AttributeApi = {
  id: "attr-int",
  ruleset: "sys1",
  name: "Inteligencia",
  key: "int",
  abbreviation: "INT",
};

const characterAttributes: CharacterAttributeApi[] = [
  { id: "attr-int", name: "Inteligencia", key: "int", value: 16, modifier: 3 },
  { id: "attr-wis", name: "Sabiduría", key: "wis", value: 12, modifier: 1 },
];

describe("buildSpellcastingLevel", () => {
  it("evaluates default 5e formulas when class formulas are missing", () => {
    const source: SpellcastingLevelSource = {
      class: "wizard-id",
      abilityKey: "int",
      slots: { cantrips: 3, slots: { "1": 2, "2": 0 } },
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 2);

    expect(result.class).toBe("wizard-id");
    expect(result.ability).toEqual(intAbility);
    expect(result.slots).toEqual(source.slots);
    expect(result.spellSaveDc).toBe(13); // 8 + 2 + 3
    expect(result.spellAttackBonus).toBe(5); // 2 + 3
  });

  it("uses class formulas when provided", () => {
    const source: SpellcastingLevelSource = {
      class: "wizard-id",
      abilityKey: "int",
      slots: { cantrips: 4, slots: { "1": 4 } },
      spellSaveDcFormula: "10 + @spellcasting.modifier",
      spellAttackBonusFormula: "@spellcasting.modifier",
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 2);

    expect(result.spellSaveDc).toBe(13);
    expect(result.spellAttackBonus).toBe(3);
  });

  it("exposes the default formula constants used as fallback", () => {
    expect(DEFAULT_SPELL_SAVE_DC_FORMULA).toContain("@spellcasting.modifier");
    expect(DEFAULT_SPELL_ATTACK_BONUS_FORMULA).toContain("@proficiencyBonus");
  });
});
