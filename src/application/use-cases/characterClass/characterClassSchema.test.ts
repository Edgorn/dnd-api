import { describe, it, expect } from "vitest";
import {
  CreateCharacterClassSchema,
  UpdateCharacterClassSchema,
  GetCharacterClassesQuerySchema,
  GetCharacterClassCatalogQuerySchema,
  GetCharacterClassByIdQuerySchema
} from "../../../infrastructure/http/schemas/characterClass.schema";

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
  it("accepts spell_choices with a ritual boolean filter", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      levels: [
        {
          level: 1,
          spell_choices: [{ choose: 1, filter: { level: 1, ritual: true } }]
        }
      ]
    });

    expect(result.success).toBe(true);
  });

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

  it("accepts magical secrets spell_choices and expertise on a level", () => {
    const secrets = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      levels: [{
        level: 10,
        skillProficiencyChoices: { choose: 2, value: 2, from: "proficient" },
        spell_choices: [{
          choose: 2,
          source: "anyClassList",
          levels: "castable",
          includeCantrips: true,
          countsTowardKnown: false
        }]
      }]
    });
    expect(secrets.success).toBe(true);

    const triple = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Picaro",
      levels: [{ level: 1, skillProficiencyChoices: { choose: 2, value: 3, from: "proficient" } }]
    });
    expect(triple.success).toBe(true);
  });

  it("rejects an invalid skillProficiencyChoices value", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      levels: [{ level: 3, skillProficiencyChoices: { choose: 2, value: 4, from: "proficient" } }]
    });
    expect(result.success).toBe(false);
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

  it("accepts fixedLevelSlots on a level spellcasting table", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      levels: [
        {
          level: 1,
          spellcasting: { cantrips: 2, spellsLearned: 2, fixedLevelSlots: { count: 1, level: 1 } }
        },
        {
          level: 3,
          spellcasting: { spellsLearned: 1, fixedLevelSlots: { count: 2, level: 2 } }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects slots and fixedLevelSlots on the same level", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      levels: [
        {
          level: 1,
          spellcasting: { slots: { "1": 2 }, fixedLevelSlots: { count: 1, level: 1 } }
        }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects mixing table slots and fixedLevelSlots across levels", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      levels: [
        { level: 1, spellcasting: { slots: { "1": 2 } } },
        { level: 2, spellcasting: { fixedLevelSlots: { count: 2, level: 1 } } }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects fixedLevelSlots with count below 1", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      levels: [{ level: 1, spellcasting: { fixedLevelSlots: { count: 0, level: 1 } } }]
    });

    expect(result.success).toBe(false);
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

  it("accepts spellReplacement with count", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      spellReplacement: { count: 1 }
    });

    expect(result.success).toBe(true);
  });

  it("accepts spellReplacement with includeCantrips", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      spellReplacement: { count: 1, includeCantrips: true }
    });

    expect(result.success).toBe(true);
  });

  it("rejects spellReplacement with count below 1", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      spellReplacement: { count: 0 }
    });

    expect(result.success).toBe(false);
  });

  it("accepts optionReplacements with a group and count", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      optionReplacements: [{ groupId: coinId, count: 1 }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects optionReplacements with count below 1", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      optionReplacements: [{ groupId: coinId, count: 0 }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects optionReplacements with a duplicate groupId", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      optionReplacements: [
        { groupId: coinId, count: 1 },
        { groupId: coinId, count: 2 }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects optionReplacements with an invalid groupId", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      optionReplacements: [{ groupId: "invocations", count: 1 }]
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
          traits: [traitId],
          traits_data: { [traitId]: { "{dice}": "2d6" } }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("accepts a spell repository with copy source and destination", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      spellRepository: {
        ...wizardSpellRepository,
        source: "classList",
        destination: "known",
        ritualOnly: false,
        maxLevel: "castable"
      }
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

  it("accepts traits_data on a level", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      levels: [
        {
          level: 1,
          traits: [traitId],
          traits_data: { [traitId]: { "{dice}": "2d6", uses: "1" } }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects traits_data values that are not string maps", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Mago",
      levels: [
        {
          level: 1,
          traits_data: { [traitId]: { uses: 1 } }
        }
      ]
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

  it("accepts null to clear spellReplacement", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      spellReplacement: null
    });

    expect(result.success).toBe(true);
  });

  it("accepts null to clear optionReplacements", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      optionReplacements: null
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

  it("accepts traits_data on a level", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      levels: [
        {
          level: 6,
          traits: [traitId],
          traits_data: { [traitId]: { "{dice}": "3d6" } }
        }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects traits_data values that are not string maps", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      levels: [{ level: 6, traits_data: { [traitId]: ["2d6"] } }]
    });

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

describe("CharacterClassSchema abilityScoreAlternativeGroupId", () => {
  const groupId = "507f1f77bcf86cd799439011";

  it("accepts an ObjectId on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      abilityScoreAlternativeGroupId: groupId
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid id on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      abilityScoreAlternativeGroupId: "feats"
    });
    expect(result.success).toBe(false);
  });

  it("accepts null on update to disable the alternative", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      abilityScoreAlternativeGroupId: null
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateCharacterClassSchema proficiencies_choices", () => {
  const proficiencyId = "507f1f77bcf86cd799439011";

  it("accepts proficiencies_choices with options ids", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      proficiencies_choices: [{ choose: 3, options: [proficiencyId] }]
    });

    expect(result.success).toBe(true);
  });

  it("accepts proficiencies_choices with a type filter", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      proficiencies_choices: [{ choose: 3, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects proficiencies_choices when choose is less than 1", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      proficiencies_choices: [{ choose: 0, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateCharacterClassSchema proficiencies_choices", () => {
  const proficiencyId = "507f1f77bcf86cd799439011";

  it("accepts proficiencies_choices on update", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      proficiencies_choices: [{ choose: 3, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(true);
  });

  it("accepts null on update to clear the list", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      proficiencies_choices: null
    });

    expect(result.success).toBe(true);
  });

  it("rejects proficiencies_choices when choose is less than 1", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      proficiencies_choices: [{ choose: 0, options: [proficiencyId] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateCharacterClassSchema levels.skill_choices", () => {
  it("accepts choose-only skill_choices on a level", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      levels: [{ level: 3, skill_choices: { choose: 3 } }]
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.levels?.[0].skill_choices).toEqual({ choose: 3 });
    }
  });

  it("rejects choose less than 1 on a level", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      levels: [{ level: 3, skill_choices: { choose: 0 } }]
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateCharacterClassSchema levels.skill_choices", () => {
  it("accepts null on a level to clear the choice", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      levels: [{ level: 3, skill_choices: null }]
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateCharacterClassSchema skill_choices", () => {
  const skillId = "507f1f77bcf86cd799439011";

  it("accepts choose-only, options, and filter modes", () => {
    const chooseOnly = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      skill_choices: { choose: 3 }
    });
    expect(chooseOnly.success).toBe(true);
    if (chooseOnly.success) {
      expect(chooseOnly.data.skill_choices).toEqual({ choose: 3 });
    }

    const withOptions = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      skill_choices: { choose: 3, options: [skillId] }
    });
    expect(withOptions.success).toBe(true);
    if (withOptions.success) {
      expect(withOptions.data.skill_choices).toEqual({
        choose: 3,
        options: [skillId]
      });
    }

    const withFilter = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      skill_choices: { choose: 1, filter: { key: "athletics" } }
    });
    expect(withFilter.success).toBe(true);
    if (withFilter.success) {
      expect(withFilter.data.skill_choices).toEqual({
        choose: 1,
        filter: { key: "athletics" }
      });
    }
  });

  it("rejects choose less than 1", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Bardo",
      skill_choices: { choose: 0 }
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateCharacterClassSchema skill_choices", () => {
  it("accepts null on update to clear the choice", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      skill_choices: null
    });

    expect(result.success).toBe(true);
  });
});

describe("CharacterClassSchema multiclass", () => {
  it("accepts fighter-style dip data on create", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      multiclass: {
        requirements: { attributeMode: "all", attributes: [{ key: "str", min: 13 }] },
        proficiencies: ["light-armor"],
        skill_choices: { choose: 1, options: ["skill1", "skill2"] },
        proficiencies_choices: [{ choose: 1, options: ["prof1"] }]
      }
    });

    expect(result.success).toBe(true);
  });

  it("rejects a requirement with min below 1", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Guerrero",
      multiclass: {
        requirements: { attributes: [{ key: "str", min: 0 }] }
      }
    });

    expect(result.success).toBe(false);
  });

  it("accepts null on update to clear multiclass", () => {
    const result = UpdateCharacterClassSchema.safeParse({
      multiclass: null
    });

    expect(result.success).toBe(true);
  });
});

describe("CreateCharacterClassSchema levels.optionChoices", () => {
  it("accepts optionChoices with choose and replace", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      levels: [{
        level: 2,
        optionChoices: [{
          groupId: coinId,
          choose: 2,
          replace: 1
        }]
      }]
    });
    expect(result.success).toBe(true);
  });

  it("rejects optionChoices with choose and replace at 0", () => {
    const result = CreateCharacterClassSchema.safeParse({
      ruleset: "sys1",
      name: "Brujo",
      levels: [{
        level: 2,
        optionChoices: [{ groupId: coinId, choose: 0 }]
      }]
    });
    expect(result.success).toBe(false);
  });
});

describe("character class query schemas", () => {
  it("accepts an optional ruleset on the list query", () => {
    expect(GetCharacterClassesQuerySchema.safeParse({}).success).toBe(true);
    expect(GetCharacterClassesQuerySchema.safeParse({ ruleset: "sys1" }).success).toBe(true);
    expect(GetCharacterClassesQuerySchema.safeParse({ ruleset: "" }).success).toBe(false);
  });

  it("accepts include=multiclass on the catalog query", () => {
    expect(GetCharacterClassCatalogQuerySchema.safeParse({ ruleset: "sys1" }).success).toBe(true);
    expect(GetCharacterClassCatalogQuerySchema.safeParse({
      ruleset: "sys1",
      include: "multiclass"
    }).success).toBe(true);
    expect(GetCharacterClassCatalogQuerySchema.safeParse({ include: "spells" }).success).toBe(false);
  });

  it("accepts an optional ruleset on the detail query", () => {
    expect(GetCharacterClassByIdQuerySchema.safeParse({}).success).toBe(true);
    expect(GetCharacterClassByIdQuerySchema.safeParse({ ruleset: "sys1" }).success).toBe(true);
  });
});
