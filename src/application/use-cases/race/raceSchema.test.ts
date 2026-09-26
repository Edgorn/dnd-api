import { describe, it, expect } from "vitest";
import { CreateRaceSchema, GetRacesQuerySchema, UpdateRaceSchema } from "../../../infrastructure/http/schemas/race.schema";

const proficiencyId = "507f1f77bcf86cd799439011";

const baseRace = {
  name: "Elfo",
  ruleset: "sys1",
  speed: { walk: 30 },
  size: "Medium"
};

describe("CreateRaceSchema proficiencies_choices", () => {
  it("accepts proficiencies_choices with options ids", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      proficiencies_choices: [{ choose: 1, options: [proficiencyId] }]
    });

    expect(result.success).toBe(true);
  });

  it("accepts proficiencies_choices with a type filter", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      proficiencies_choices: [{ choose: 1, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects proficiencies_choices when choose is less than 1", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      proficiencies_choices: [{ choose: 0, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateRaceSchema proficiencies_choices", () => {
  it("accepts proficiencies_choices on update", () => {
    const result = UpdateRaceSchema.safeParse({
      proficiencies_choices: [{ choose: 1, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects proficiencies_choices when choose is less than 1", () => {
    const result = UpdateRaceSchema.safeParse({
      proficiencies_choices: [{ choose: 0, options: [proficiencyId] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateRaceSchema creature type and playable", () => {
  it("accepts an optional creature type and an explicit playable flag", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      creatureTypeId: "507f1f77bcf86cd799439012",
      playable: false
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.playable).toBe(false);
      expect(result.data.creatureTypeId).toBe("507f1f77bcf86cd799439012");
    }
  });

  it("rejects a string playable value", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      playable: "false"
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateRaceSchema creature type and playable", () => {
  it("accepts a partial update that only changes playable", () => {
    const result = UpdateRaceSchema.safeParse({ playable: true });

    expect(result.success).toBe(true);
  });

  it("accepts clearing the creature type with null", () => {
    const result = UpdateRaceSchema.safeParse({ creatureTypeId: null });

    expect(result.success).toBe(true);
  });
});

describe("GetRacesQuerySchema playable", () => {
  it("keeps the string false instead of coercing it to true", () => {
    const result = GetRacesQuerySchema.safeParse({ playable: "false" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.playable).toBe("false");
    }
  });

  it("accepts playable true and an omitted filter", () => {
    expect(GetRacesQuerySchema.safeParse({ playable: "true" }).success).toBe(true);
    expect(GetRacesQuerySchema.safeParse({}).success).toBe(true);
  });

  it("rejects values outside true and false", () => {
    const result = GetRacesQuerySchema.safeParse({ playable: "yes" });

    expect(result.success).toBe(false);
  });
});
