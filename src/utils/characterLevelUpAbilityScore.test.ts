import { describe, it, expect } from "vitest";
import {
  applyAbilityScoreIncreases,
  validateLevelUpAbilityScorePick
} from "./characterLevelUpAbilityScore";

const attributes = [
  { key: "str", value: 15 },
  { key: "dex", value: 14 },
  { key: "con", value: 13 },
  { key: "int", value: 10 },
  { key: "wis", value: 12 },
  { key: "cha", value: 8 }
];

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
  it("returns none when the level has no ASI and no pick is sent", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: false,
      attributes
    })).toEqual({ kind: "none" });
  });

  it("rejects a pick when the level has no ASI", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: false,
      increases: [{ key: "str", bonus: 2 }],
      attributes
    });
    expect(result).toEqual({ error: "Este nivel no ofrece mejora de característica ni alternativa" });
  });

  it("requires abilityScore when the level grants ASI without alternative", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      attributes
    });
    expect(result).toEqual({
      error: "Debe enviar abilityScore en un nivel con mejora de característica"
    });
  });

  it("requires abilityScore or abilityScoreOption when an alternative is offered", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      alternativeOffered: true,
      attributes
    });
    expect(result).toEqual({
      error: "Debe enviar abilityScore o abilityScoreOption en un nivel con mejora de característica"
    });
  });

  it("rejects sending both increases and an option", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      alternativeOffered: true,
      increases: [{ key: "str", bonus: 2 }],
      optionId: "opt-ok",
      attributes
    });
    expect(result).toEqual({ error: "Debe elegir mejora de característica o una opción, no ambas" });
  });

  it("rejects an option when the level has no alternative", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      optionId: "opt-ok",
      attributes
    });
    expect(result).toEqual({ error: "Este nivel no ofrece una alternativa a la mejora de característica" });
  });

  it("accepts a +2 increase", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes,
      maxAttributeValue: 20
    })).toEqual({ kind: "increases", increases: [{ key: "str", bonus: 2 }] });
  });

  it("accepts two +1 increases", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 1 }, { key: "dex", bonus: 1 }],
      attributes
    })).toEqual({
      kind: "increases",
      increases: [{ key: "str", bonus: 1 }, { key: "dex", bonus: 1 }]
    });
  });

  it("rejects a total other than 2", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 1 }],
      attributes
    });
    expect(result).toEqual({ error: "La mejora de característica debe sumar 2 puntos" });
  });

  it("rejects duplicate keys", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 1 }, { key: "str", bonus: 1 }],
      attributes
    });
    expect(result).toEqual({ error: "La característica str está duplicada" });
  });

  it("rejects an unknown attribute key", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "luck", bonus: 2 }],
      attributes
    });
    expect(result).toEqual({ error: "El personaje no tiene la característica luck" });
  });

  it("rejects going over the system max", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes: [{ key: "str", value: 19 }],
      maxAttributeValue: 20
    });
    expect(result).toEqual({ error: "str no puede superar 20" });
  });

  it("does not cap when maxAttributeValue is omitted", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes: [{ key: "str", value: 19 }]
    })).toEqual({ kind: "increases", increases: [{ key: "str", bonus: 2 }] });
  });

  it("uses trait max and owned bonus for the final score", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes: [{ key: "str", value: 16 }],
      maxAttributeValue: 20,
      bonusByKey: { str: 4 },
      maxByKey: { str: 24 }
    })).toEqual({ kind: "increases", increases: [{ key: "str", bonus: 2 }] });
  });

  it("rejects when stored plus trait bonus plus ASI exceeds the trait max", () => {
    const result = validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      increases: [{ key: "str", bonus: 2 }],
      attributes: [{ key: "str", value: 20 }],
      maxAttributeValue: 20,
      bonusByKey: { str: 4 },
      maxByKey: { str: 24 }
    });
    expect(result).toEqual({ error: "str no puede superar 24" });
  });

  it("accepts an option when the alternative is offered", () => {
    expect(validateLevelUpAbilityScorePick({
      abilityScoreGranted: true,
      alternativeOffered: true,
      optionId: "opt-ok",
      attributes
    })).toEqual({ kind: "option", optionId: "opt-ok" });
  });
});
