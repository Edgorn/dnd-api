import { describe, expect, it } from "vitest";
import { CharacterApi } from "../domain/types/character.types";
import { CreatureApi } from "../domain/types/creature.types";
import { Damage } from "../domain/types";
import { applyActiveFormOverlay } from "./applyActiveFormOverlay";

const fire: Damage = { id: "fire", name: "Fuego", description: "", color: "", ruleset: "dnd5e" };

const wolf = {
  id: "wolf",
  name: "Lobo",
  size: "Medium",
  CA: 13,
  HPMax: 11,
  speed: { walk: 40 },
  attributes: [
    { id: "str", name: "Fuerza", key: "str", value: 12, modifier: 1 },
    { id: "dex", name: "Destreza", key: "dex", value: 15, modifier: 2 }
  ],
  damage_resistances: [{ damageTypes: [fire], source: "any", bypass: [] }],
  condition_immunities: [{ id: "frightened", name: "Asustado", ruleset: "dnd5e" }]
} as CreatureApi;

function sheet(overrides: Partial<CharacterApi> = {}): CharacterApi {
  return {
    id: "char1",
    name: "Mage",
    size: "Medium",
    ac: 15,
    hpMax: 40,
    hpCurrent: 32,
    speed: { walk: 30 },
    initiativeBonus: 3,
    attributes: [
      { id: "str", name: "Fuerza", key: "str", value: 8, modifier: -1 },
      { id: "dex", name: "Destreza", key: "dex", value: 16, modifier: 3 },
      { id: "int", name: "Inteligencia", key: "int", value: 18, modifier: 4 }
    ],
    resistances: [],
    conditionImmunities: [],
    forms: [{
      id: "form1",
      purpose: "self",
      spellId: "poly",
      creature: wolf,
      active: true
    }],
    activeFormId: "form1",
    ...overrides
  } as CharacterApi;
}

describe("applyActiveFormOverlay", () => {
  it("overlays combat stats from the active self form", () => {
    const overlay = applyActiveFormOverlay(sheet());

    expect(overlay.size).toBe("Medium");
    expect(overlay.speed).toEqual({ walk: 40 });
    expect(overlay.ac).toBe(13);
    expect(overlay.hpMax).toBe(11);
    expect(overlay.hpCurrent).toBe(11);
    expect(overlay.attributes.find(item => item.key === "str")?.value).toBe(12);
    expect(overlay.attributes.find(item => item.key === "dex")?.modifier).toBe(2);
    expect(overlay.attributes.find(item => item.key === "int")?.value).toBe(18);
    expect(overlay.initiativeBonus).toBe(2);
    expect(overlay.resistances.map(item => item.id)).toEqual(["fire"]);
    expect(overlay.conditionImmunities[0]?.name).toBe("Lobo");
  });

  it("recalculates initiative with the system formula", () => {
    const overlay = applyActiveFormOverlay(sheet(), {
      initiativeBonusFormula: "@attributes.dex.modifier + 2"
    });
    expect(overlay.initiativeBonus).toBe(4);
  });

  it("overlays combat stats from an active target form", () => {
    const overlay = applyActiveFormOverlay(sheet({
      forms: [{
        id: "form1",
        purpose: "target",
        spellId: "poly",
        creature: wolf,
        active: true
      }]
    }));

    expect(overlay.hpMax).toBe(11);
    expect(overlay.ac).toBe(13);
  });

  it("does not overlay a companion form", () => {
    const original = sheet({
      activeFormId: "form1",
      forms: [{
        id: "form1",
        purpose: "companion",
        spellId: "familiar",
        creature: wolf,
        active: false
      }]
    });
    const overlay = applyActiveFormOverlay(original);
    expect(overlay.hpMax).toBe(40);
    expect(overlay.ac).toBe(15);
  });

  it("leaves the sheet unchanged without an active form", () => {
    const original = sheet({ activeFormId: null });
    expect(applyActiveFormOverlay(original).hpMax).toBe(40);
  });
});
