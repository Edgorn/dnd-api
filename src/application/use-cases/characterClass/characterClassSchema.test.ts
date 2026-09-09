import { describe, it, expect } from "vitest";
import { CreateCharacterClassSchema } from "../../../infrastructure/http/schemas/characterClass.schema";

describe("CreateCharacterClassSchema levels.spell_choices", () => {
  it("accepts spell_choices with a multi-level filter", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      levels: [
        {
          level: 1,
          spell_choices: [{ choose: 1, filter: { level: [1, 2, 3, 4] } }]
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("accepts spell_choices with options ids", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      levels: [
        {
          level: 1,
          spell_choices: [{ choose: 2, options: ["507f1f77bcf86cd799439011"] }]
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("accepts spellsLearned on a level spellcasting table", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      levels: [
        {
          level: 1,
          spellcasting: { cantrips: 2, spellsLearned: 4, slots: { "1": 2 } }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative spellsLearned value", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      levels: [
        {
          level: 1,
          spellcasting: { spellsLearned: -1, slots: { "1": 2 } }
        }
      ]
    });

    expect(result.success).toBe(false);
  });
});
