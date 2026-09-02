import { describe, it, expect } from "vitest";
import { enrichEquipmentWithCombatBonuses } from "./combatBonuses";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";

const sampleAttributes = [
  { key: "str", name: "Fuerza", value: 16, modifier: 3 },
  { key: "dex", name: "Destreza", value: 14, modifier: 2 },
];

const baseEquipment: CharacterEquipmentApi = {
  id: "eq1",
  ruleset: "dnd5e",
  name: "Espada larga",
  description: "",
  cost: { quantity: 15, unit: "gp" },
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
  proficiencies: [{ id: "prof1", name: "Espadas largas", description: "", ruleset: "dnd5e" }],
};

describe("enrichEquipmentWithCombatBonuses", () => {
  it("returns equipment unchanged when formulas are missing", () => {
    const result = enrichEquipmentWithCombatBonuses({
      equipment: [baseEquipment],
      attributes: sampleAttributes as any,
      proficiencies: [{ id: "prof1", name: "Espadas largas", description: "", ruleset: "dnd5e" }],
      proficiencyBonus: 2,
      level: 1,
      rules: {},
    });

    expect(result[0].attackBonus).toBeUndefined();
    expect(result[0].damageBonus).toBeUndefined();
  });

  it("calculates attack and damage bonuses for proficient melee weapon", () => {
    const result = enrichEquipmentWithCombatBonuses({
      equipment: [baseEquipment],
      attributes: sampleAttributes as any,
      proficiencies: [{ id: "prof1", name: "Espadas largas", description: "", ruleset: "dnd5e" }],
      proficiencyBonus: 2,
      level: 1,
      rules: {
        meleeAttackAttributes: ["str"],
        rangedAttackAttributes: ["dex"],
        attackBonusFormula: "@weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus",
        damageBonusFormula: "@weapon.attributeModifier",
      },
    });

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

    expect(result[0].attackBonus).toBe(4);
    expect(result[0].damageBonus).toBe(4);
  });
});
