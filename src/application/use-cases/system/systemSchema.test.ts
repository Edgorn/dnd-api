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

describe("UpdateSystemSchema abilityScoreProgression", () => {
  it("accepts an empty array", () => {
    const result = UpdateSystemSchema.safeParse({
      abilityScoreProgression: []
    });

    expect(result.success).toBe(true);
  });
});
