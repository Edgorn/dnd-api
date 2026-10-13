import { describe, expect, it } from "vitest";
import { PersonajeApi } from "../domain/types/personajes.types";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";
import { TraitApi } from "../domain/types/traits.types";
import { Damage } from "../domain/types";
import { ConditionApi } from "../domain/types/condition.types";
import { applyActiveTraitOverlays } from "./applyActiveTraitOverlays";

const bludgeoning: Damage = { id: "bludgeoning", name: "Contundente", description: "", color: "", ruleset: "dnd5e" };
const fire: Damage = { id: "fire", name: "Fuego", description: "", color: "", ruleset: "dnd5e" };
const frightened: ConditionApi = { id: "frightened", name: "Asustado", ruleset: "dnd5e" };
const charmed: ConditionApi = { id: "charmed", name: "Hechizado", ruleset: "dnd5e" };

const attributes = [
  { id: "str", name: "Fuerza", key: "str", value: 16, modifier: 3 },
  { id: "dex", name: "Destreza", key: "dex", value: 14, modifier: 2 }
];

const dexHigher = [
  { id: "str", name: "Fuerza", key: "str", value: 12, modifier: 1 },
  { id: "dex", name: "Destreza", key: "dex", value: 16, modifier: 3 }
];

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
  action: { activation: "bonusAction", kind: "stance", active: true },
  weaponDamageBonus: {
    when: "active",
    melee: true,
    abilityKeys: ["str"],
    amount: 2
  }
};

const mindlessRage: TraitApi = {
  id: "mindless",
  name: "Furia Irracional",
  description: [],
  summary: [],
  ruleset: "dnd5e",
  incompatible_traits: [],
  resistances: [],
  conditional_resistances: [],
  condition_inmunities: [],
  proficiencies: [],
  conditionalResistanceGroup: "Furia",
  conditionalConditionImmunities: [frightened, charmed]
};

const bear: TraitApi = {
  id: "bear",
  name: "Espíritu tótem oso",
  description: [],
  summary: [],
  ruleset: "dnd5e",
  incompatible_traits: [],
  resistances: [],
  conditional_resistances: [bludgeoning, fire],
  condition_inmunities: [],
  proficiencies: [],
  conditionalResistanceGroup: "Furia"
};

const greataxe = (damageBonus = 3): CharacterEquipmentApi => ({
  id: "axe",
  instanceId: "axe-1",
  name: "Hacha",
  quantity: 1,
  isProficient: true,
  damageBonus,
  weapon: {
    damage: [],
    two_handed_damage: [],
    properties: [],
    range: "Cuerpo a cuerpo"
  }
} as CharacterEquipmentApi);

const rapier = (damageBonus = 3): CharacterEquipmentApi => ({
  id: "rapier",
  instanceId: "rapier-1",
  name: "Estoque",
  quantity: 1,
  isProficient: true,
  damageBonus,
  weapon: {
    damage: [],
    two_handed_damage: [],
    properties: [{
      id: "finesse",
      name: "Sutil",
      description: "",
      ruleset: "dnd5e",
      attackAttributes: ["dex"]
    }],
    range: "Cuerpo a cuerpo"
  }
} as CharacterEquipmentApi);

const longbow = (damageBonus = 2): CharacterEquipmentApi => ({
  id: "bow",
  instanceId: "bow-1",
  name: "Arco",
  quantity: 1,
  isProficient: true,
  damageBonus,
  weapon: {
    damage: [],
    two_handed_damage: [],
    properties: [],
    range: "Distancia"
  }
} as CharacterEquipmentApi);

function sheet(overrides: Partial<PersonajeApi> = {}): PersonajeApi {
  return {
    id: "char1",
    name: "Grok",
    attributes,
    CA: 13,
    traits: [rage, bear, mindlessRage],
    resistances: [],
    equipment: [greataxe(), rapier(), longbow()],
    activeTraitIds: ["rage"],
    ...overrides
  } as PersonajeApi;
}

const rules = { meleeAttackAttributes: ["str"], rangedAttackAttributes: ["dex"] };

describe("applyActiveTraitOverlays", () => {
  it("adds group conditional resistances when a stance is on", () => {
    const overlay = applyActiveTraitOverlays(sheet(), rules);
    expect(overlay.resistances.map(item => item.id)).toEqual(["bludgeoning", "fire"]);
    expect(overlay.CA).toBe(13);
  });

  it("adds group conditional condition immunities when a stance is on", () => {
    const overlay = applyActiveTraitOverlays(sheet(), rules);
    expect(overlay.condition_inmunities).toEqual([{
      name: "Furia",
      estados: [frightened, charmed]
    }]);
  });

  it("adds melee STR weapon damage and skips a rapier that attacks with DEX", () => {
    const overlay = applyActiveTraitOverlays(sheet({ attributes: dexHigher }), rules);
    const axe = overlay.equipment.find(item => item.id === "axe");
    const estoque = overlay.equipment.find(item => item.id === "rapier");
    const bow = overlay.equipment.find(item => item.id === "bow");

    expect(axe?.damageBonus).toBe(5);
    expect(estoque?.damageBonus).toBe(3);
    expect(bow?.damageBonus).toBe(2);
  });

  it("adds melee STR damage when Strength wins the attack attribute", () => {
    const overlay = applyActiveTraitOverlays(sheet(), rules);
    expect(overlay.equipment.find(item => item.id === "axe")?.damageBonus).toBe(5);
    expect(overlay.equipment.find(item => item.id === "rapier")?.damageBonus).toBe(5);
  });

  it("does not change damage or resistances when no stance is active", () => {
    const inactiveRage: TraitApi = {
      ...rage,
      action: { activation: "bonusAction", kind: "stance", active: false }
    };
    const overlay = applyActiveTraitOverlays(sheet({
      traits: [inactiveRage, bear, mindlessRage],
      activeTraitIds: []
    }), rules);

    expect(overlay.resistances).toEqual([]);
    expect(overlay.condition_inmunities ?? []).toEqual([]);
    expect(overlay.equipment.find(item => item.id === "axe")?.damageBonus).toBe(3);
  });

  it("does not overlay when the stance is suppressed by armor", () => {
    const armoredRage: TraitApi = {
      ...rage,
      suppressedByArmorTypeIds: ["heavy"]
    };
    const overlay = applyActiveTraitOverlays(sheet({
      traits: [armoredRage, bear, mindlessRage],
      equipment: [{
        ...greataxe(),
        equipped: true,
        armor: { type: { id: "heavy" }, class: { base: 16 } }
      }]
    }), rules);

    expect(overlay.resistances).toEqual([]);
    expect(overlay.condition_inmunities ?? []).toEqual([]);
    expect(overlay.equipment[0].damageBonus).toBe(3);
  });
});
