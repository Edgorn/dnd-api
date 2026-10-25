import { describe, expect, it } from "vitest";
import { CharacterApi } from "../domain/types/character.types";
import { toCharacterBasic } from "./characterBasicFromApi";

function sheet(overrides: Partial<CharacterApi> = {}): CharacterApi {
  return {
    id: "c1",
    img: "https://img",
    name: "Ada",
    race: "Humano",
    size: "medium",
    classes: [{ class: "cls", level: 3, name: "Mago", hitDie: 6 }],
    subclasses: [{ class: "cls", name: "Evocación", id: "sub1" }],
    campaign: { id: "camp1", name: "Barovia" },
    appearance: {} as CharacterApi["appearance"],
    background: {} as CharacterApi["background"],
    level: 3,
    xp: 900,
    xpMax: 2700,
    attributes: [{ id: "a", name: "Destreza", key: "dex", value: 16, modifier: 3, description: "larga" }],
    systems: ["sys"],
    initiativeBonus: 5,
    hpMax: 20,
    hpCurrent: 18,
    ac: 18,
    speed: { walk: 12, fly: 9 },
    skills: [],
    languages: { speaks: [], understands: [], notes: [] },
    proficiencies: [],
    traits: [],
    traitsData: {},
    resistances: [],
    conditionalResistances: [],
    conditionImmunities: [],
    conditionalConditionImmunities: [],
    proficiencyBonus: 2,
    savingThrows: [],
    equipment: [],
    wearingArmorWithoutProficiency: false,
    money: [],
    spells: {},
    maxCarryingCapacity: 150,
    companions: [],
    traitResources: [],
    activeTraitIds: ["stance"],
    hitDice: [],
    spellSlots: [],
    activeConditions: [],
    ...overrides,
  };
}

describe("toCharacterBasic", () => {
  it("projects list-card fields and drops sheet-only data", () => {
    const basic = toCharacterBasic(sheet(), { user: "Edgar" });

    expect(basic).toEqual({
      id: "c1",
      img: "https://img",
      name: "Ada",
      race: "Humano",
      user: "Edgar",
      campaign: "Barovia",
      classes: [{ name: "Mago", level: 3 }],
      subclasses: [{ class: "cls", name: "Evocación", id: "sub1" }],
      ac: 18,
      hpMax: 20,
      hpCurrent: 18,
      xp: 900,
      xpMax: 2700,
      attributes: [{ key: "dex", value: 16 }],
      systems: ["sys"],
      speed: { walk: 12, fly: 9 },
    });
  });

  it("prefers persisted ac and speed over stance overlays on the sheet", () => {
    const basic = toCharacterBasic(sheet(), {
      user: "Edgar",
      ac: 13,
      speed: { walk: 9 },
    });

    expect(basic.ac).toBe(13);
    expect(basic.speed).toEqual({ walk: 9 });
  });

  it("uses null campaign when the sheet has no campaign", () => {
    const basic = toCharacterBasic(sheet({ campaign: null }), { user: "Edgar" });
    expect(basic.campaign).toBeNull();
  });
});
