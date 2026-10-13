import { describe, expect, it } from "vitest";
import {
  applyTraitAbilityScores,
  collectTraitAbilityScores,
  effectiveAttributeMax
} from "./applyTraitAbilityScores";

const attributes = [
  { key: "str", value: 20 },
  { key: "dex", value: 14 },
  { key: "con", value: 20 }
];

const primalChampion = {
  abilityScores: [
    { key: "str", bonus: 4, max: 24 },
    { key: "con", bonus: 4, max: 24 }
  ]
};

describe("applyTraitAbilityScores", () => {
  it("adds bonuses and raises str/con to 24", () => {
    const result = applyTraitAbilityScores(attributes, [primalChampion]);
    expect(result.attributes).toEqual([
      { key: "str", value: 24 },
      { key: "dex", value: 14 },
      { key: "con", value: 24 }
    ]);
    expect(result.bonusByKey).toEqual({ str: 4, con: 4 });
    expect(result.maxByKey).toEqual({ str: 24, con: 24 });
  });

  it("does not clamp to 20 when the trait has no max", () => {
    const result = applyTraitAbilityScores(attributes, [{
      abilityScores: [{ key: "str", bonus: 4 }]
    }]);
    expect(result.attributes.find(item => item.key === "str")?.value).toBe(24);
    expect(result.maxByKey).toEqual({});
  });

  it("clamps to the trait max", () => {
    const result = applyTraitAbilityScores(
      [{ key: "str", value: 20 }],
      [{ abilityScores: [{ key: "str", bonus: 8, max: 24 }] }]
    );
    expect(result.attributes[0].value).toBe(24);
  });

  it("sums stacked bonuses and keeps the highest max", () => {
    const result = applyTraitAbilityScores(
      [{ key: "str", value: 16 }],
      [
        { abilityScores: [{ key: "str", bonus: 2, max: 22 }] },
        { abilityScores: [{ key: "str", bonus: 2, max: 24 }] }
      ]
    );
    expect(result.bonusByKey.str).toBe(4);
    expect(result.maxByKey.str).toBe(24);
    expect(result.attributes[0].value).toBe(20);
  });

  it("returns stored values when there are no abilityScores", () => {
    expect(applyTraitAbilityScores(attributes, [{ name: "Furia" }])).toEqual({
      attributes,
      bonusByKey: {},
      maxByKey: {}
    });
  });

  it("copies key and value from getter-only documents", () => {
    const stored = [
      Object.defineProperties({}, {
        key: { get: () => "str", enumerable: false },
        value: { get: () => 20, enumerable: false }
      }),
      Object.defineProperties({}, {
        key: { get: () => "dex", enumerable: false },
        value: { get: () => 14, enumerable: false }
      })
    ] as { key: string; value: number }[];

    const result = applyTraitAbilityScores(stored, [primalChampion]);
    expect(result.attributes).toEqual([
      { key: "str", value: 24 },
      { key: "dex", value: 14 }
    ]);
    expect(result.attributes.every(item => Object.prototype.hasOwnProperty.call(item, "key"))).toBe(true);
  });
});

describe("collectTraitAbilityScores", () => {
  it("ignores empty trait lists", () => {
    expect(collectTraitAbilityScores(undefined)).toEqual({ bonusByKey: {}, maxByKey: {} });
  });
});

describe("effectiveAttributeMax", () => {
  it("prefers the trait max over the system default", () => {
    expect(effectiveAttributeMax("str", { str: 24 }, 20)).toBe(24);
    expect(effectiveAttributeMax("dex", { str: 24 }, 20)).toBe(20);
    expect(effectiveAttributeMax("dex", {}, undefined)).toBeUndefined();
  });
});
