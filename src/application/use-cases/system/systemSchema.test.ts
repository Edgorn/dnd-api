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

describe("UpdateSystemSchema abilityScoreProgression", () => {
  it("accepts an empty array", () => {
    const result = UpdateSystemSchema.safeParse({
      abilityScoreProgression: []
    });

    expect(result.success).toBe(true);
  });
});
