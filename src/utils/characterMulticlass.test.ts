import { describe, it, expect } from "vitest";
import { FeatRequirements } from "../domain/types/feat.types";
import {
  characterMeetsAllClassRequirements,
  excludeOwnedChoiceOptions,
  shouldEnforceMulticlassRequirements,
  unionUnique,
  validateChoiceListPicks,
  validateChoicePicks
} from "./characterMulticlass";

const str13: FeatRequirements = {
  attributeMode: "all",
  attributes: [{ key: "str", name: "Fuerza", min: 13 }]
};

const dex13: FeatRequirements = {
  attributeMode: "all",
  attributes: [{ key: "dex", name: "Destreza", min: 13 }]
};

const attributes = [
  { key: "str", value: 15 },
  { key: "dex", value: 12 }
];

describe("shouldEnforceMulticlassRequirements", () => {
  it("enforces on a dip even if the character has a single class", () => {
    expect(shouldEnforceMulticlassRequirements(1, true)).toBe(true);
  });

  it("enforces when continuing a class if the character is already multiclass", () => {
    expect(shouldEnforceMulticlassRequirements(2, false)).toBe(true);
  });

  it("does not enforce when a single-class character continues that class", () => {
    expect(shouldEnforceMulticlassRequirements(1, false)).toBe(false);
  });
});

describe("characterMeetsAllClassRequirements", () => {
  it("passes when every involved class is satisfied", () => {
    expect(characterMeetsAllClassRequirements([{ requirements: str13 }, {}], attributes)).toBe(true);
  });

  it("fails if any involved class is not satisfied", () => {
    expect(characterMeetsAllClassRequirements(
      [{ requirements: str13 }, { requirements: dex13 }],
      attributes
    )).toBe(false);
  });

  it("treats a class without requirements as satisfied", () => {
    expect(characterMeetsAllClassRequirements([undefined, {}], attributes)).toBe(true);
  });
});

describe("unionUnique", () => {
  it("merges without duplicates", () => {
    expect(unionUnique(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("excludeOwnedChoiceOptions", () => {
  it("drops options the character already has", () => {
    const choice = excludeOwnedChoiceOptions(
      { choose: 1, options: [{ id: "skill-1" }, { id: "skill-2" }] },
      ["skill-1"]
    );
    expect(choice?.options).toEqual([{ id: "skill-2" }]);
    expect(choice?.choose).toBe(1);
  });
});

describe("validateChoicePicks", () => {
  it("accepts the exact remaining options", () => {
    const result = validateChoicePicks({
      choose: 1,
      optionIds: ["a", "b"],
      picks: ["b"],
      ownedIds: ["a"],
      field: "skillPicks"
    });
    expect(result).toEqual({ ids: ["b"] });
  });

  it("rejects an already owned option", () => {
    const result = validateChoicePicks({
      choose: 1,
      optionIds: ["a", "b"],
      picks: ["a"],
      ownedIds: ["a"],
      field: "skillPicks"
    });
    expect(result).toMatchObject({ error: expect.stringContaining("ya posee") });
  });

  it("rejects a pick outside the hydrated options", () => {
    const result = validateChoicePicks({
      choose: 1,
      optionIds: ["a"],
      picks: ["z"],
      ownedIds: [],
      field: "skillPicks"
    });
    expect(result).toMatchObject({ error: expect.stringContaining("no está entre") });
  });
});

describe("validateChoiceListPicks", () => {
  it("collects picks from each choice", () => {
    const result = validateChoiceListPicks({
      choices: [
        { choose: 1, options: [{ id: "p1" }, { id: "p2" }] },
        { choose: 1, options: [{ id: "p3" }] }
      ],
      picks: [["p1"], ["p3"]],
      ownedIds: [],
      field: "proficiencyPicks"
    });
    expect(result).toEqual({ ids: ["p1", "p3"] });
  });

  it("rejects extra picks when there are no choices", () => {
    const result = validateChoiceListPicks({
      choices: [],
      picks: [["p1"]],
      ownedIds: [],
      field: "proficiencyPicks"
    });
    expect(result).toMatchObject({ error: expect.stringContaining("no aplica") });
  });
});
