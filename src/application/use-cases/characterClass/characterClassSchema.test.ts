import { describe, it, expect } from "vitest";
import { CreateCharacterClassSchema, UpdateCharacterClassSchema } from "../../../infrastructure/http/schemas/characterClass.schema";

const coinId = "507f1f77bcf86cd799439011";
const traitId = "507f1f77bcf86cd799439012";

const wizardSpellRepository = {
  name: "Libro de conjuros",
  equipmentId: coinId,
  includesCantrips: false,
  copy: { hoursPerSpellLevel: 2, costPerSpellLevel: { quantity: 50, unit: coinId } },
  duplicate: { hoursPerSpellLevel: 1, costPerSpellLevel: { quantity: 10, unit: coinId } },
  recoverPreparedOnLoss: true
};

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

  it("accepts spellsPreparedFormula together with preparedFrom", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      spellsPreparedFormula: "@class.level + @spellcasting.modifier",
      preparedFrom: "known"
    });

    expect(result.success).toBe(true);
  });

  it("rejects spellsPreparedFormula without preparedFrom", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      spellsPreparedFormula: "@class.level + @spellcasting.modifier"
    });

    expect(result.success).toBe(false);
  });

  it("rejects preparedFrom without spellsPreparedFormula", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Clerigo",
      preparedFrom: "classList"
    });

    expect(result.success).toBe(false);
  });

  it("accepts god as a boolean on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Clerigo",
      god: true
    });

    expect(result.success).toBe(true);
  });

  it("rejects god when it is not a boolean on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Clerigo",
      god: "yes"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a spell repository config, level traits and subclassChoice", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      spellRepository: wizardSpellRepository,
      subclassChoice: {
        name: "Tradiciones arcanas",
        description: ["El estudio de la magia es muy antiguo."],
        level: 2
      },
      levels: [
        {
          level: 1,
          spellcasting: { cantrips: 3, spellsLearned: 6, slots: { "1": 2 } },
          traits: [traitId]
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects a spell repository with a negative copy cost", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      spellRepository: {
        ...wizardSpellRepository,
        copy: { hoursPerSpellLevel: 2, costPerSpellLevel: { quantity: -1, unit: coinId } }
      }
    });

    expect(result.success).toBe(false);
  });

  it("rejects level traits that are not ObjectIds", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      levels: [{ level: 1, traits: ["tu-libro-de-conjuros"] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateCharacterClassSchema spellRepository", () => {
  it("accepts null to clear the spell repository", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      spellRepository: null
    });

    expect(result.success).toBe(true);
  });

  it("accepts subclassChoice and null to clear it", () => {
    const withChoice = UpdateCharacterClassSchema.safeParse({
      subclassChoice: {
        name: "Tradiciones arcanas",
        description: ["El estudio de la magia es muy antiguo."],
        level: 2
      }
    });
    const cleared = UpdateCharacterClassSchema.safeParse({
      subclassChoice: null
    });

    expect(withChoice.success).toBe(true);
    expect(cleared.success).toBe(true);
  });

  it("accepts god true or false on update", () => {
    expect(UpdateCharacterClassSchema.safeParse({ god: true }).success).toBe(true);
    expect(UpdateCharacterClassSchema.safeParse({ god: false }).success).toBe(true);
  });

  it("rejects god when it is not a boolean on update", () => {
    const result = UpdateCharacterClassSchema.safeParse({ god: 1 });
    expect(result.success).toBe(false);
  });
});

describe("CharacterClassSchema abilityScoreProgression", () => {
  it("is optional on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago"
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty array on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      abilityScoreProgression: []
    });

    expect(result.success).toBe(true);
  });

  it("accepts a fighter override on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      abilityScoreProgression: [4, 6, 8, 12, 14, 16, 19]
    });

    expect(result.success).toBe(true);
  });

  it("rejects a level of 0", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      abilityScoreProgression: [0, 4]
    });

    expect(result.success).toBe(false);
  });

  it("accepts null on update to clear the override", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      abilityScoreProgression: null
    });

    expect(result.success).toBe(true);
  });

  it("accepts an empty array on update", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      abilityScoreProgression: []
    });

    expect(result.success).toBe(true);
  });
});
