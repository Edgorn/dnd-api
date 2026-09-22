import { describe, it, expect } from "vitest";
import { Damage } from "../domain/types";
import { TraitApi } from "../domain/types/traits.types";
import {
  applyEnteringTraitChoices,
  mergeTraitLanguageIds,
  resolveCharacterTraitChoices
} from "./traitDamageChoices";

const fire: Damage = {
  id: "fire",
  name: "Fuego",
  description: "",
  color: "#f00",
  ruleset: "dnd5e"
};

const cold: Damage = {
  id: "cold",
  name: "Frío",
  description: "",
  color: "#0ff",
  ruleset: "dnd5e"
};

const trait = (id: string, extra: Partial<TraitApi> = {}): TraitApi => ({
  id,
  name: id,
  description: [`Linaje {name}. Daño {damage}.`],
  summary: ["{name}: {damage}"],
  ruleset: "dnd5e",
  incompatible_traits: [],
  resistances: [],
  conditional_resistances: [],
  condition_inmunities: [],
  proficiencies: [],
  ...extra
});

const ancestry = trait("draconic-ancestry", {
  damageChoices: [{
    key: "ancestor",
    choose: 1,
    options: [
      { name: "Rojo", damageTypeId: "fire", damage: fire },
      { name: "Plata", damageTypeId: "cold", damage: cold }
    ]
  }]
});

describe("applyEnteringTraitChoices", () => {
  it("requires a choice when the trait enters", () => {
    const result = applyEnteringTraitChoices({
      enteringTraits: [ancestry]
    });

    expect(result).toEqual({
      error: "Debe elegir las opciones de daño (ancestor) del rasgo draconic-ancestry"
    });
  });

  it("stores the selected row names", () => {
    const result = applyEnteringTraitChoices({
      incoming: { "draconic-ancestry": { ancestor: ["Rojo"] } },
      enteringTraits: [ancestry]
    });

    expect(result).toEqual({
      traitChoices: { "draconic-ancestry": { ancestor: ["Rojo"] } }
    });
  });

  it("keeps a stored choice when it is omitted or repeated", () => {
    const existing = { "draconic-ancestry": { ancestor: ["Rojo"] } };

    const omitted = applyEnteringTraitChoices({
      existing,
      enteringTraits: [ancestry]
    });
    const repeated = applyEnteringTraitChoices({
      existing,
      incoming: { "draconic-ancestry": { ancestor: ["Rojo"] } },
      enteringTraits: [ancestry]
    });

    expect(omitted).toEqual({ traitChoices: existing });
    expect(repeated).toEqual({ traitChoices: existing });
  });

  it("rejects a different selection once the choice is stored", () => {
    const result = applyEnteringTraitChoices({
      existing: { "draconic-ancestry": { ancestor: ["Rojo"] } },
      incoming: { "draconic-ancestry": { ancestor: ["Plata"] } },
      enteringTraits: []
    });

    expect(result).toEqual({
      error: "La elección ancestor del rasgo draconic-ancestry ya está guardada"
    });
  });

  it("does not replace stored choices when another trait enters", () => {
    const result = applyEnteringTraitChoices({
      existing: { "draconic-ancestry": { ancestor: ["Rojo"] } },
      incoming: { "elemental-affinity": { element: ["Fuego"] } },
      enteringTraits: [trait("elemental-affinity", {
        damageChoices: [{
          key: "element",
          choose: 1,
          options: [{ name: "Fuego", damageTypeId: "fire", damage: fire }]
        }]
      })]
    });

    expect(result).toEqual({
      traitChoices: {
        "draconic-ancestry": { ancestor: ["Rojo"] },
        "elemental-affinity": { element: ["Fuego"] }
      }
    });
  });
});

describe("resolveCharacterTraitChoices", () => {
  const resistance = trait("draconic-resistance", {
    description: ["Resistencia a {damage}."],
    summary: ["{name}"],
    damageChoiceRef: {
      traitId: "draconic-ancestry",
      choiceKey: "ancestor",
      grantsResistance: true
    }
  });

  it("resolves the row, substitutes placeholders and grants resistance when opted in", () => {
    const result = resolveCharacterTraitChoices(
      [ancestry, resistance],
      { "draconic-ancestry": { ancestor: ["Rojo"] } }
    );

    const resolved = [{ name: "Rojo", damage: fire }];
    expect(result.traits[0].damageChoice).toEqual(resolved);
    expect(result.traits[0].description).toEqual(["Linaje Rojo. Daño Fuego."]);
    expect(result.traits[0].summary).toEqual(["Rojo: Fuego"]);
    expect(result.traits[1].damageChoice).toEqual(resolved);
    expect(result.traits[1].description).toEqual(["Resistencia a Fuego."]);
    expect(result.grantedResistances).toEqual([fire]);
  });

  it("does not grant resistance unless the reference opts in", () => {
    const result = resolveCharacterTraitChoices(
      [ancestry, trait("draconic-breath", {
        damageChoiceRef: { traitId: "draconic-ancestry", choiceKey: "ancestor" }
      })],
      { "draconic-ancestry": { ancestor: ["Rojo"] } }
    );

    expect(result.traits[1].damageChoice?.[0].name).toBe("Rojo");
    expect(result.grantedResistances).toEqual([]);
  });

  it("adds nothing and does not fail when the origin is not chosen", () => {
    const result = resolveCharacterTraitChoices([ancestry, resistance], {});

    expect(result.traits[0].damageChoice).toBeUndefined();
    expect(result.traits[0].description[0]).toContain("{name}");
    expect(result.traits[1].damageChoice).toBeUndefined();
    expect(result.grantedResistances).toEqual([]);
  });

  it("joins several selected rows with a comma", () => {
    const multiple = trait("wards", {
      damageChoices: [{
        key: "wards",
        choose: 2,
        options: [
          { name: "Rojo", damageTypeId: "fire", damage: fire },
          { name: "Plata", damageTypeId: "cold", damage: cold }
        ]
      }]
    });

    const result = resolveCharacterTraitChoices(
      [multiple],
      { wards: { wards: ["Rojo", "Plata"] } }
    );

    expect(result.traits[0].description).toEqual(["Linaje Rojo, Plata. Daño Fuego, Frío."]);
    expect(result.grantedResistances).toEqual([]);
  });
});

describe("mergeTraitLanguageIds", () => {
  it("unions character languages with trait grants and drops duplicates", () => {
    const result = mergeTraitLanguageIds(
      { speaks: ["common"], understands: ["common"] },
      [{
        languages: {
          speaks: [
            { id: "common", name: "Común", ruleset: "dnd5e" },
            { id: "draconic", name: "Dracónico", ruleset: "dnd5e" }
          ],
          understands: [{ id: "draconic", name: "Dracónico", ruleset: "dnd5e" }]
        }
      }]
    );

    expect(result).toEqual({
      speaks: ["common", "draconic"],
      understands: ["common", "draconic"]
    });
  });
});
