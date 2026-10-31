import { describe, it, expect } from "vitest";
import { CreateSystemSchema, UpdateSystemSchema } from "../../../infrastructure/http/schemas/system.schema";

describe("CreateSystemSchema abilityScoreProgression", () => {
  it("accepts the default 5e class levels", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      maxLevel: 20,
      abilityScoreProgression: [4, 8, 12, 16, 19]
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty array to disable ASI", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      abilityScoreProgression: []
    });

    expect(result.success).toBe(true);
  });

  it("rejects duplicate levels", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      abilityScoreProgression: [4, 4, 8]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a level of 0", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      abilityScoreProgression: [0, 4]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a level greater than maxLevel", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      maxLevel: 10,
      abilityScoreProgression: [4, 8, 12]
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateSystemSchema kind", () => {
  it("defaults kind to ruleset", () => {
    const result = CreateSystemSchema.safeParse({ name: "D&D 5e" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kind).toBe("ruleset");
    }
  });

  it("rejects an unknown kind", () => {
    const result = CreateSystemSchema.safeParse({ name: "Homebrew", kind: "world" });

    expect(result.success).toBe(false);
  });

  it("requires parentIds for a setting", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Forgotten Realms",
      kind: "setting"
    });

    expect(result.success).toBe(false);
  });

  it("rejects formulas on a setting", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Forgotten Realms",
      kind: "setting",
      parentIds: ["507f1f77bcf86cd799439011"],
      maxLevel: 20
    });

    expect(result.success).toBe(false);
  });

  it("accepts a campaign layer with a parent and no rules", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Mesa del viernes",
      kind: "campaign",
      parentIds: ["507f1f77bcf86cd799439011"]
    });

    expect(result.success).toBe(true);
  });
});

describe("UpdateSystemSchema kind", () => {
  it("requires parentIds when kind is setting or campaign", () => {
    const result = UpdateSystemSchema.safeParse({ kind: "campaign" });

    expect(result.success).toBe(false);
  });

  it("rejects formulas when changing to a setting", () => {
    const result = UpdateSystemSchema.safeParse({
      kind: "setting",
      parentIds: ["507f1f77bcf86cd799439011"],
      hpInitialFormula: "10"
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateSystemSchema restRules", () => {
  const restRules = {
    kinds: [
      { key: "shortRest", name: "Descanso corto", duration: { value: 1, unit: "hour" } },
      { key: "longRest", name: "Descanso largo", duration: { value: 8, unit: "hour" }, includes: ["shortRest"] },
    ],
  };

  it("accepts a valid rest catalog", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      restRules,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a cycle in includes", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      restRules: {
        kinds: [
          { key: "a", name: "A", includes: ["b"] },
          { key: "b", name: "B", includes: ["a"] },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts endStancesOn keys from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      restRules: { ...restRules, endStancesOn: ["shortRest"] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects endStancesOn keys missing from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      restRules: { ...restRules, endStancesOn: ["watch"] },
    });
    expect(result.success).toBe(false);
  });

  it("accepts hitPointRecovery keys from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      restRules: {
        ...restRules,
        hitPointRecovery: [{ restKey: "longRest", hp: "full", hitDice: "half" }],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects hitPointRecovery keys missing from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      restRules: {
        ...restRules,
        hitPointRecovery: [{ restKey: "watch", hp: "full", hitDice: "all" }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts spellSlotRecovery keys from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      restRules: {
        ...restRules,
        spellSlotRecovery: [
          { restKey: "shortRest", pools: ["fixedLevel"] },
          { restKey: "longRest", pools: ["standard", "fixedLevel"] },
        ],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects spellSlotRecovery keys missing from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      restRules: {
        ...restRules,
        spellSlotRecovery: [{ restKey: "watch", pools: ["standard"] }],
      },
    });
    expect(result.success).toBe(false);
  });

  it("accepts hitDiceSpending keys from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      restRules: {
        ...restRules,
        hitDiceSpending: { on: ["shortRest"], bonusFormula: "@attributes.con.modifier" },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects hitDiceSpending keys missing from kinds", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      restRules: {
        ...restRules,
        hitDiceSpending: { on: ["watch"] },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid hitDiceSpending bonusFormula", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      restRules: {
        ...restRules,
        hitDiceSpending: { on: ["shortRest"], bonusFormula: "1d8 + @attributes.con.modifier" },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects restRules on a setting", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Forgotten Realms",
      kind: "setting",
      parentIds: ["507f1f77bcf86cd799439011"],
      restRules,
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateSystemSchema catalog exclusions", () => {
  const raceId = "507f1f77bcf86cd799439011";
  const classId = "507f1f77bcf86cd799439012";

  it("accepts unique ObjectId arrays on a setting", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Forgotten Realms",
      kind: "setting",
      parentIds: ["507f1f77bcf86cd799439013"],
      excludedRaceIds: [raceId],
      excludedClassIds: [classId],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicate race ids", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      excludedRaceIds: [raceId, raceId],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid class id", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      excludedClassIds: ["wizard"],
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateSystemSchema abilityScoreProgression", () => {
  it("accepts an empty array", () => {
    const result = UpdateSystemSchema.safeParse({
      abilityScoreProgression: []
    });

    expect(result.success).toBe(true);
  });
});

describe("CreateSystemSchema abilityScoreAlternativeGroupId", () => {
  const groupId = "507f1f77bcf86cd799439011";

  it("accepts an ObjectId", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      abilityScoreAlternativeGroupId: groupId
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty string to disable the alternative", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Homebrew",
      abilityScoreAlternativeGroupId: ""
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid id", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      abilityScoreAlternativeGroupId: "feats"
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateSystemSchema carrying rules", () => {
  it("accepts draw and barding scalars", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      drawCapacityMultiplier: 5,
      bardingCostMultiplier: 4,
      bardingWeightMultiplier: 2
    });
    expect(result.success).toBe(true);
  });

  it("rejects creature carry tokens in carryingCapacityFormula", () => {
    const result = CreateSystemSchema.safeParse({
      name: "D&D 5e",
      carryingCapacityFormula: "@attributes.str.value * 15 * @size.carryMultiplier"
    });
    expect(result.success).toBe(false);
  });

  it("rejects carrying rules on a setting", () => {
    const result = CreateSystemSchema.safeParse({
      name: "Forgotten Realms",
      kind: "setting",
      parentIds: ["507f1f77bcf86cd799439011"],
      drawCapacityMultiplier: 5
    });
    expect(result.success).toBe(false);
  });
});
