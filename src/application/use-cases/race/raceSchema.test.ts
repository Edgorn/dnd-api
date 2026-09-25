import { describe, it, expect } from "vitest";
import { CreateRaceSchema, UpdateRaceSchema } from "../../../infrastructure/http/schemas/race.schema";

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
