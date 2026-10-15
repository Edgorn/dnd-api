import { describe, it, expect } from "vitest";
import { FeatRequirements } from "../domain/types/feat.types";
import {
  characterMeetsAllClassRequirements,
  excludeOwnedChoiceOptions,
  mergeSkillChoices,
  resolveLevelSkillPicks,
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

describe("mergeSkillChoices", () => {
  it("sums choose and unions options from class and subclass", () => {
    const merged = mergeSkillChoices(
      { choose: 1, options: [{ id: "a" }, { id: "b" }], query_type: "options" },
      { choose: 3, options: [{ id: "b" }, { id: "c" }, { id: "d" }], query_type: "all" }
    );
    expect(merged?.choose).toBe(4);
    expect(merged?.query_type).toBe("all");
    expect(merged?.options.map(option => option.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns the only defined choice", () => {
    const only = { choose: 3, options: [{ id: "a" }], query_type: "all" as const };
    expect(mergeSkillChoices(undefined, only)).toEqual(only);
  });
});

describe("resolveLevelSkillPicks", () => {
  it("accepts subclass skill picks on the same level-up as choosing the subclass", () => {
    const result = resolveLevelSkillPicks({
      levelChoice: {
        choose: 3,
        options: [{ id: "arcana" }, { id: "history" }, { id: "nature" }, { id: "religion" }],
        query_type: "all"
      },
      ownedIds: ["arcana"],
      picks: ["history", "nature", "religion"]
    });
    expect(result).toEqual({ ids: ["history", "nature", "religion"] });
  });

  it("adds dip and level chooses into one skillPicks list", () => {
    const result = resolveLevelSkillPicks({
      dipChoice: { choose: 1, options: [{ id: "stealth" }, { id: "arcana" }] },
      levelChoice: { choose: 2, options: [{ id: "stealth" }, { id: "arcana" }, { id: "history" }] },
      ownedIds: [],
      picks: ["stealth", "arcana", "history"]
    });
    expect(result).toEqual({ ids: ["stealth", "arcana", "history"] });
  });

  it("rejects skillPicks when there is no choice", () => {
    const result = resolveLevelSkillPicks({
      ownedIds: [],
      picks: ["history"]
    });
    expect(result).toMatchObject({ error: expect.stringContaining("no aplica") });
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
