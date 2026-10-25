import { describe, expect, it } from "vitest";
import { CharacterApi } from "../domain/types/character.types";
import { toCombatCharacter, toSheetCharacter, toSpellRef } from "./characterViews";

const SPELL = {
  id: "s1",
  ruleset: "sys",
  name: "Bola de fuego",
  level: 3,
  classes: [],
  description: ["Largo"],
  tables: [],
  ritual: false,
  school: { id: "evoc", name: "Evocación", description: "", color: "red" }
};

function sheet(): CharacterApi {
  return {
    id: "c1",
    img: "",
    name: "Ada",
    race: "Humano",
    size: "medium",
    classes: [{ class: "cls", level: 1, name: "Mago", hitDie: 6 }],
    subclasses: [],
    campaign: null,
    appearance: {} as CharacterApi["appearance"],
    background: { alignment: "legal bueno" } as CharacterApi["background"],
    level: 1,
    xp: 0,
    xpMax: 300,
    attributes: [{ id: "a", name: "Destreza", key: "dex", value: 14, modifier: 2, description: "larga" }],
    systems: ["sys"],
    initiativeBonus: 2,
    hpMax: 8,
    hpCurrent: 6,
    ac: 12,
    speed: { walk: 9 },
    skills: [{ id: "sk", name: "Sigilo", key: "stealth", value: 1, modifier: 4, description: "texto", attributeScore: ["dex"] }],
    languages: { speaks: [], understands: [], notes: [] },
    proficiencies: [],
    traits: [{
      id: "t1",
      name: "Furia",
      description: ["desc"],
      summary: "sum",
      incompatible_traits: [{ id: "other", name: "Otro" }]
    } as CharacterApi["traits"][number]],
    traitsData: {},
    resistances: [],
    conditionalResistances: [],
    conditionImmunities: [],
    conditionalConditionImmunities: [],
    proficiencyBonus: 2,
    savingThrows: ["str"],
    equipment: [],
    wearingArmorWithoutProficiency: false,
    money: [],
    spells: {
      cls: { list: [SPELL], extra: [SPELL], prepared: [SPELL] }
    },
    maxCarryingCapacity: 150,
    optionSelections: [],
    forms: [],
    spellPrivileges: [],
    companions: [],
    traitResources: [],
    activeTraitIds: ["t1"],
    hitDice: [],
    spellSlots: [],
    activeConditions: []
  };
}

describe("characterViews", () => {
  it("toCombatCharacter keeps combat fields and slims spells, skills and traits", () => {
    const combat = toCombatCharacter(sheet());
    expect(combat.name).toBe("Ada");
    expect(combat.alignment).toBe("legal bueno");
    expect(combat.spells.cls.list).toEqual([{ id: "s1", name: "Bola de fuego", level: 3 }]);
    expect(combat.skills[0]).toMatchObject({ name: "Sigilo", key: "stealth", value: 1, modifier: 4 });
    expect(combat.skills[0]).not.toHaveProperty("description");
    expect(combat.attributes[0]).toEqual({ key: "dex", value: 14, modifier: 2 });
    expect(combat.traits[0]).toMatchObject({ id: "t1", name: "Furia" });
    expect(combat.traits[0]).not.toHaveProperty("incompatible_traits");
    expect(combat).not.toHaveProperty("equipment");
    expect(combat).not.toHaveProperty("money");
  });

  it("toSheetCharacter maps spells to ids without duplicating the catalog", () => {
    const projected = toSheetCharacter(sheet());
    expect(projected.spells.cls.list).toEqual(["s1"]);
    expect(projected.spells.cls.extra).toEqual(["s1"]);
    expect(Object.keys(projected.spellsById)).toEqual(["s1"]);
    expect(projected.spellsById.s1).toMatchObject({ id: "s1", name: "Bola de fuego", level: 3 });
    expect(projected.spellsById.s1).not.toHaveProperty("description");
    expect(projected.traits[0]).not.toHaveProperty("incompatible_traits");
    expect(projected.traits[0].summary).toBe("sum");
  });

  it("toSpellRef requires an id", () => {
    expect(toSpellRef({ name: "x", level: 0 })).toBeNull();
  });
});
