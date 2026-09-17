import { describe, it, expect } from "vitest";
import { FeatApi, FeatRequirements } from "../domain/types/feat.types";
import {
  applyAbilityScoreIncreases,
  featMeetsRequirements,
  filterLevelUpFeatChoices,
  getOwnedFeatIds,
  validateLevelUpAbilityScorePick
} from "./characterLevelUpAbilityScore";

const feat = (id: string, requirements?: Partial<FeatRequirements>): FeatApi => ({
  id,
  name: id,
  description: [],
  summary: [],
  ruleset: "sys1",
  requirements: {
    attributeMode: requirements?.attributeMode ?? "all",
    attributes: requirements?.attributes ?? []
  }
});

const attributes = [
  { key: "str", value: 15 },
  { key: "dex", value: 14 },
  { key: "con", value: 13 },
  { key: "int", value: 10 },
  { key: "wis", value: 12 },
  { key: "cha", value: 8 }
];

describe("getOwnedFeatIds", () => {
  it("merges feats and legacy dotes without duplicates", () => {
    expect(getOwnedFeatIds({
      feats: ["feat-a", "feat-b"],
      dotes: ["feat-b", "feat-c"]
    })).toEqual(["feat-a", "feat-b", "feat-c"]);
  });

  it("treats missing arrays as empty", () => {
    expect(getOwnedFeatIds({})).toEqual([]);
  });
});

describe("featMeetsRequirements", () => {
  it("passes when there are no attribute requirements", () => {
    expect(featMeetsRequirements(feat("alert"), attributes)).toBe(true);
  });

  it("requires every attribute in all mode", () => {
    const heavy = feat("heavy", {
      attributeMode: "all",
      attributes: [
        { key: "str", name: "Fuerza", min: 13 },
        { key: "con", name: "Constitución", min: 13 }
      ]
    });
    expect(featMeetsRequirements(heavy, attributes)).toBe(true);
    expect(featMeetsRequirements(heavy, [{ key: "str", value: 12 }, { key: "con", value: 13 }])).toBe(false);
  });

  it("requires any attribute in any mode", () => {
    const flexible = feat("flexible", {
      attributeMode: "any",
      attributes: [
        { key: "str", name: "Fuerza", min: 20 },
        { key: "dex", name: "Destreza", min: 13 }
      ]
    });
    expect(featMeetsRequirements(flexible, attributes)).toBe(true);
    expect(featMeetsRequirements(flexible, [{ key: "str", value: 10 }, { key: "dex", value: 10 }])).toBe(false);
  });

  it("treats a missing attribute as 0", () => {
    const requiresInt = feat("keen", {
      attributes: [{ key: "int", name: "Inteligencia", min: 13 }]
    });
    expect(featMeetsRequirements(requiresInt, [{ key: "str", value: 18 }])).toBe(false);
  });
});

describe("filterLevelUpFeatChoices", () => {
  it("returns undefined when there is no choice", () => {
    expect(filterLevelUpFeatChoices(undefined, [], attributes)).toBeUndefined();
  });

  it("drops owned feats and those that fail requirements", () => {
    const filtered = filterLevelUpFeatChoices(
      {
        choose: 1,
        options: [
          feat("owned"),
          feat("locked", { attributes: [{ key: "str", name: "Fuerza", min: 20 }] }),
          feat("ok")
        ]
      },
      ["owned"],
      attributes
    );

    expect(filtered?.options.map(option => option.id)).toEqual(["ok"]);
  });
});

describe("applyAbilityScoreIncreases", () => {
  it("applies a +2 to one score", () => {
    expect(applyAbilityScoreIncreases(attributes, [{ key: "str", bonus: 2 }])).toEqual([
      { key: "str", value: 17 },
      { key: "dex", value: 14 },
      { key: "con", value: 13 },
      { key: "int", value: 10 },
      { key: "wis", value: 12 },
      { key: "cha", value: 8 }
    ]);
  });

  it("applies two +1 increases", () => {
    const next = applyAbilityScoreIncreases(attributes, [
      { key: "dex", bonus: 1 },
      { key: "con", bonus: 1 }
    ]);
    expect(next.find(attribute => attribute.key === "dex")?.value).toBe(15);
    expect(next.find(attribute => attribute.key === "con")?.value).toBe(14);
  });
});

describe("validateLevelUpAbilityScorePick", () => {
  const availableFeatIds = ["feat-ok"];

  it("returns none when the level has no ASI and no pick is sent", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: false,
      attributes,
      availableFeatIds
    })).toEqual({ kind: "none" });
  });

  it("rejects a pick when the level has no ASI", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: false,
      increases: [{ key: "str", bonus: 2 }],
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({ error: "Este nivel no ofrece mejora de característica ni dote" });
  });

  it("requires a pick when the level grants ASI", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({
      error: "Debe enviar abilityScore o feat en un nivel con mejora de característica"
    });
  });

  it("rejects sending both increases and a feat", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      featId: "feat-ok",
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({ error: "Debe elegir mejora de característica o dote, no ambas" });
  });

  it("accepts a +2 increase", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes,
      availableFeatIds,
      maxAttributeValue: 20
    })).toEqual({ kind: "increases", increases: [{ key: "str", bonus: 2 }] });
  });

  it("accepts two +1 increases", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 1 }, { key: "dex", bonus: 1 }],
      attributes,
      availableFeatIds
    })).toEqual({
      kind: "increases",
      increases: [{ key: "str", bonus: 1 }, { key: "dex", bonus: 1 }]
    });
  });

  it("rejects a total other than 2", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 1 }],
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({ error: "La mejora de característica debe sumar 2 puntos" });
  });

  it("rejects duplicate keys", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 1 }, { key: "str", bonus: 1 }],
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({ error: "La característica str está duplicada" });
  });

  it("rejects an unknown attribute key", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "luck", bonus: 2 }],
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({ error: "El personaje no tiene la característica luck" });
  });

  it("rejects going over the system max", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes: [{ key: "str", value: 19 }],
      availableFeatIds,
      maxAttributeValue: 20
    });
    expect(result).toEqual({ error: "str no puede superar 20" });
  });

  it("does not cap when maxAttributeValue is omitted", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes: [{ key: "str", value: 19 }],
      availableFeatIds
    })).toEqual({ kind: "increases", increases: [{ key: "str", bonus: 2 }] });
  });

  it("accepts a feat from the filtered options", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      featId: "feat-ok",
      attributes,
      availableFeatIds
    })).toEqual({ kind: "feat", featId: "feat-ok" });
  });

  it("rejects a feat that is not available", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      featId: "feat-locked",
      attributes,
      availableFeatIds
    });
    expect(result).toEqual({ error: "La dote feat-locked no está entre las opciones disponibles" });
  });
});
