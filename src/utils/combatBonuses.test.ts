import { describe, it, expect } from "vitest";
import { enrichEquipmentWithCombatBonuses, isEquipmentProficient } from "./combatBonuses";
import { EquipmentInstanceApi } from "../domain/types/equipment.types";
import { ProficiencyApi } from "../domain/types/proficiencies.types";

const sampleAttributes = [
  { key: "str", name: "Fuerza", value: 16, modifier: 3 },
  { key: "dex", name: "Destreza", value: 14, modifier: 2 },
];

const proficiency: ProficiencyApi = {
  id: "prof1",
  name: "Espadas largas",
  type: "Weapons",
  parentProficiencyId: null,
  ruleset: "dnd5e",
  deletedAt: null,
};

const emptyCost = {
  quantity: 15,
  id: "coin1",
  ruleset: "dnd5e",
  name: "Gold Piece",
  abbreviation: "gp",
  isBase: true,
  multiplier: 1,
  weight: 0.02,
  color: "#FFD700",
};

const baseEquipment: EquipmentInstanceApi = {
  id: "eq1",
  ruleset: "dnd5e",
  name: "Espada larga",
  description: "",
  cost: emptyCost,
  weight: 3,
  category: "Arma",
  subcategory: "Marcial",
  quantity: 1,
  weapon: {
    category: "Marcial",
    damage: [{ dice: "1d8", name: "Cortante", desc: "" }],
    two_handed_damage: [],
    properties: [],
    range: "Cuerpo a cuerpo",
  },
  proficiencies: [proficiency],
};

describe("isEquipmentProficient", () => {
  it("returns true when equipment requires no proficiencies", () => {
    expect(isEquipmentProficient({ ...baseEquipment, proficiencies: [] }, [])).toBe(true);
    expect(isEquipmentProficient({ ...baseEquipment, proficiencies: undefined }, [])).toBe(true);
  });

  it("returns true when character has a matching proficiency", () => {
    expect(isEquipmentProficient(baseEquipment, [proficiency])).toBe(true);
  });

  it("returns false when character lacks required proficiency", () => {
    expect(isEquipmentProficient(baseEquipment, [])).toBe(false);
  });
});

describe("enrichEquipmentWithCombatBonuses", () => {
  it("sets isProficient even when formulas are missing", () => {
    const result = enrichEquipmentWithCombatBonuses({
      equipment: [baseEquipment],
      attributes: sampleAttributes as any,
      proficiencies: [proficiency],
      proficiencyBonus: 2,
      level: 1,
      rules: {},
    });

    expect(result[0].isProficient).toBe(true);
    expect(result[0].attackBonus).toBeUndefined();
    expect(result[0].damageBonus).toBeUndefined();
  });

  it("sets isProficient false when character is not proficient", () => {
    const result = enrichEquipmentWithCombatBonuses({
      equipment: [baseEquipment],
      attributes: sampleAttributes as any,
      proficiencies: [],
      proficiencyBonus: 2,
      level: 1,
      rules: {},
    });

    expect(result[0].isProficient).toBe(false);
  });

  it("calculates attack and damage bonuses for proficient melee weapon", () => {
    const result = enrichEquipmentWithCombatBonuses({
      equipment: [baseEquipment],
      attributes: sampleAttributes as any,
      proficiencies: [proficiency],
      proficiencyBonus: 2,
      level: 1,
      rules: {
        meleeAttackAttributes: ["str"],
        rangedAttackAttributes: ["dex"],
        attackBonusFormula: "@weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus",
        damageBonusFormula: "@weapon.attributeModifier",
      },
    });

    expect(result[0].isProficient).toBe(true);
    expect(result[0].attackBonus).toBe(5);
    expect(result[0].damageBonus).toBe(3);
  });

  it("includes magic bonus in formula evaluation", () => {
    const result = enrichEquipmentWithCombatBonuses({
      equipment: [{ ...baseEquipment, isMagic: true }],
      attributes: sampleAttributes as any,
      proficiencies: [],
      proficiencyBonus: 2,
      level: 1,
      rules: {
        meleeAttackAttributes: ["str"],
        rangedAttackAttributes: ["dex"],
        attackBonusFormula: "@weapon.attributeModifier + @weapon.isMagic",
        damageBonusFormula: "@weapon.attributeModifier + @weapon.isMagic",
      },
    });

    expect(result[0].isProficient).toBe(false);
    expect(result[0].attackBonus).toBe(4);
    expect(result[0].damageBonus).toBe(4);
  });
});
