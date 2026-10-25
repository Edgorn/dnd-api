import { describe, expect, it } from "vitest";
import { GetCharacterQuerySchema, GetCharactersQuerySchema, LevelUpDataQuerySchema } from "./character.schema";

describe("GetCharactersQuerySchema", () => {
  it("accepts an empty query", () => {
    expect(GetCharactersQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts include=combatSeed", () => {
    const result = GetCharactersQuerySchema.safeParse({ include: "combatSeed" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe("combatSeed");
    }
  });

  it("rejects unknown include values", () => {
    const result = GetCharactersQuerySchema.safeParse({ include: "full" });
    expect(result.success).toBe(false);
  });
});

describe("GetCharacterQuerySchema", () => {
  it("accepts an empty query as full sheet", () => {
    expect(GetCharacterQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts view=combat and view=sheet", () => {
    expect(GetCharacterQuerySchema.safeParse({ view: "combat" }).success).toBe(true);
    expect(GetCharacterQuerySchema.safeParse({ view: "sheet" }).success).toBe(true);
  });

  it("rejects unknown views", () => {
    expect(GetCharacterQuerySchema.safeParse({ view: "mini" }).success).toBe(false);
  });
});

describe("LevelUpDataQuerySchema", () => {
  it("requires class and accepts optional compact view", () => {
    expect(LevelUpDataQuerySchema.safeParse({}).success).toBe(false);
    expect(LevelUpDataQuerySchema.safeParse({ class: "cls" }).success).toBe(true);
    expect(LevelUpDataQuerySchema.safeParse({ class: "cls", view: "compact" }).success).toBe(true);
    expect(LevelUpDataQuerySchema.safeParse({ class: "cls", view: "sheet" }).success).toBe(false);
  });
});
