import { describe, expect, it } from "vitest";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";
import { TraitApi } from "../domain/types/traits.types";
import { Damage } from "../domain/types";
import { toCharacterEquipmentStateDelta } from "./characterEquipmentState";

const bludgeoning: Damage = {
  id: "bludgeoning",
  name: "Contundente",
  description: "",
  color: "",
  ruleset: "dnd5e"
};

const attributes = [
  { id: "str", name: "Fuerza", key: "str", value: 12, modifier: 1 },
  { id: "dex", name: "Destreza", key: "dex", value: 14, modifier: 2 }
];

const stealthArmor: CharacterEquipmentApi = {
  id: "mail",
  instanceId: "mail-1",
  name: "Cota de mallas",
  quantity: 1,
  equipped: true,
  isProficient: false,
  equipSlot: "armor",
  armor: {
    class: { base: 16 },
    disadvantageSkillKeys: ["stealth"],
    attributeMinimum: { key: "str", value: 13, unmetSpeedPenalty: 10 }
  }
} as CharacterEquipmentApi;

const rage: TraitApi = {
  id: "rage",
  name: "Furia",
  description: [],
  summary: [],
  ruleset: "dnd5e",
  incompatible_traits: [],
  resistances: [],
  conditional_resistances: [bludgeoning],
  condition_inmunities: [],
  proficiencies: [],
  conditionalResistanceGroup: "Furia",
  action: { activation: "bonusAction", kind: "stance", active: true }
};

describe("toCharacterEquipmentStateDelta", () => {
  it("returns derived speed, stealth disadvantage and unproficient armor without a full sheet", () => {
    const delta = toCharacterEquipmentStateDelta({
      equipment: [stealthArmor],
      traits: [],
      attributes,
      baseSpeed: { walk: 30 },
      ac: 16,
      overlayRules: { meleeAttackAttributes: ["str"], rangedAttackAttributes: ["dex"] }
    });

    expect(delta.ac).toBe(16);
    expect(delta.speed).toEqual({ walk: 20 });
    expect(delta.disadvantageSkillKeys).toEqual(["stealth"]);
    expect(delta.wearingArmorWithoutProficiency).toBe(true);
    expect(delta).not.toHaveProperty("spells");
    expect(delta).not.toHaveProperty("forms");
  });

  it("merges active stance resistances into the delta", () => {
    const delta = toCharacterEquipmentStateDelta({
      equipment: [],
      traits: [rage],
      attributes,
      baseSpeed: { walk: 30 },
      ac: 13,
      activeTraitIds: ["rage"],
      overlayRules: { meleeAttackAttributes: ["str"], rangedAttackAttributes: ["dex"] }
    });

    expect(delta.resistances).toEqual([bludgeoning]);
    expect(delta.speed).toEqual({ walk: 30 });
    expect(delta.disadvantageSkillKeys).toEqual([]);
  });
});
