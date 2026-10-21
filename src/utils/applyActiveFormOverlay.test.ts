import { describe, expect, it } from "vitest";
import { PersonajeApi } from "../domain/types/personajes.types";
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

function sheet(overrides: Partial<PersonajeApi> = {}): PersonajeApi {
  return {
    id: "char1",
    name: "Mage",
    size: "Medium",
    CA: 15,
    HPMax: 40,
    HPActual: 32,
    speed: { walk: 30 },
    initiativeBonus: 3,
    attributes: [
      { id: "str", name: "Fuerza", key: "str", value: 8, modifier: -1 },
      { id: "dex", name: "Destreza", key: "dex", value: 16, modifier: 3 },
      { id: "int", name: "Inteligencia", key: "int", value: 18, modifier: 4 }
    ],
    resistances: [],
    condition_inmunities: [],
    forms: [{
      id: "form1",
      purpose: "self",
      spellId: "poly",
      creature: wolf,
      active: true
    }],
    activeFormId: "form1",
    ...overrides
  } as PersonajeApi;
}

describe("applyActiveFormOverlay", () => {
  it("overlays combat stats from the active self form", () => {
    const overlay = applyActiveFormOverlay(sheet());

    expect(overlay.size).toBe("Medium");
    expect(overlay.speed).toEqual({ walk: 40 });
    expect(overlay.CA).toBe(13);
    expect(overlay.HPMax).toBe(11);
    expect(overlay.HPActual).toBe(11);
    expect(overlay.attributes.find(item => item.key === "str")?.value).toBe(12);
    expect(overlay.attributes.find(item => item.key === "dex")?.modifier).toBe(2);
    expect(overlay.attributes.find(item => item.key === "int")?.value).toBe(18);
    expect(overlay.initiativeBonus).toBe(2);
    expect(overlay.resistances.map(item => item.id)).toEqual(["fire"]);
    expect(overlay.condition_inmunities[0]?.name).toBe("Lobo");
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

    expect(overlay.HPMax).toBe(11);
    expect(overlay.CA).toBe(13);
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
    expect(overlay.HPMax).toBe(40);
    expect(overlay.CA).toBe(15);
  });

  it("leaves the sheet unchanged without an active form", () => {
    const original = sheet({ activeFormId: null });
    expect(applyActiveFormOverlay(original).HPMax).toBe(40);
  });
});
