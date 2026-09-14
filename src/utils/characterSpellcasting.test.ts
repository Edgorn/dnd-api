import { describe, it, expect } from "vitest";
import {
  buildCantripSpellChoice,
  buildKnownSpellChoice,
  buildSpellcastingLevel,
  buildSynthesizedKnownSpellChoice,
  castableSpellLevels,
  DEFAULT_SPELL_ATTACK_BONUS_FORMULA,
  DEFAULT_SPELL_SAVE_DC_FORMULA,
  excludeKnownSpellOptions,
  hasCantripSpellChoice,
  hasKnownSpellChoice,
  remainingCantripPicks,
  resolveClassSpellSlotsForLevel,
  resolveSpellSlotsTableForLevel,
  spellsLearnedAtLevel,
  validateLevelUpSpellPicks,
  validatePreparedSpellPicks,
} from "./characterSpellcasting";
import { AttributeApi, CharacterAttributeApi } from "../domain/types/attribute.types";
import { SpellcastingLevelSource } from "../domain/types/characterClass.types";

const intAbility: AttributeApi = {
  id: "attr-int",
  ruleset: "sys1",
  name: "Inteligencia",
  key: "int",
  abbreviation: "INT",
};

const characterAttributes: CharacterAttributeApi[] = [
  { id: "attr-int", name: "Inteligencia", key: "int", value: 16, modifier: 3 },
  { id: "attr-wis", name: "Sabiduría", key: "wis", value: 12, modifier: 1 },
];

describe("buildSpellcastingLevel", () => {
  it("evaluates default 5e formulas when class formulas are missing", () => {
    const source: SpellcastingLevelSource = {
      class: "wizard-id",
      abilityKey: "int",
      slots: { cantrips: 3, slots: { "1": 2, "2": 0 } },
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 2);

    expect(result.class).toBe("wizard-id");
    expect(result.ability).toEqual(intAbility);
    expect(result.slots).toEqual(source.slots);
    expect(result.spellSaveDc).toBe(13); // 8 + 2 + 3
    expect(result.spellAttackBonus).toBe(5); // 2 + 3
  });

  it("uses class formulas when provided", () => {
    const source: SpellcastingLevelSource = {
      class: "wizard-id",
      abilityKey: "int",
      slots: { cantrips: 4, slots: { "1": 4 } },
      spellSaveDcFormula: "10 + @spellcasting.modifier",
      spellAttackBonusFormula: "@spellcasting.modifier",
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 2);

    expect(result.spellSaveDc).toBe(13);
    expect(result.spellAttackBonus).toBe(3);
  });

  it("evaluates spellsPrepared with class level and spellcasting modifier", () => {
    const source: SpellcastingLevelSource = {
      class: "wizard-id",
      abilityKey: "int",
      classLevel: 5,
      slots: { cantrips: 4, slots: { "1": 4, "2": 3, "3": 2 } },
      spellsPreparedFormula: "@class.level + @spellcasting.modifier",
      preparedFrom: "known",
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 3);

    expect(result.spellsPrepared).toBe(8);
    expect(result.preparedFrom).toBe("known");
  });

  it("clamps a negative prepared formula result to 0", () => {
    const source: SpellcastingLevelSource = {
      class: "wizard-id",
      abilityKey: "int",
      classLevel: 1,
      slots: { slots: { "1": 2 } },
      spellsPreparedFormula: "@class.level + @spellcasting.modifier - 10",
      preparedFrom: "classList",
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 2);

    expect(result.spellsPrepared).toBe(0);
  });

  it("omits spellsPrepared when the class has no preparation formula", () => {
    const source: SpellcastingLevelSource = {
      class: "sorcerer-id",
      abilityKey: "int",
      classLevel: 3,
      slots: { cantrips: 4, slots: { "1": 4 } },
    };

    const result = buildSpellcastingLevel(source, intAbility, characterAttributes, 2);

    expect(result.spellsPrepared).toBeUndefined();
    expect(result.preparedFrom).toBeUndefined();
  });

  it("exposes the default formula constants used as fallback", () => {
    expect(DEFAULT_SPELL_SAVE_DC_FORMULA).toContain("@spellcasting.modifier");
    expect(DEFAULT_SPELL_ATTACK_BONUS_FORMULA).toContain("@proficiencyBonus");
  });
});

describe("resolveClassSpellSlotsForLevel", () => {
  it("returns cantrips-only table from a lower level when the current level has no entry", () => {
    const levels = [
      { level: 1, spellcasting: { cantrips: 2 } },
      { level: 2 },
    ];

    expect(resolveClassSpellSlotsForLevel(levels, 2)).toEqual({ cantrips: 2 });
  });

  it("keeps cantrips-only tables without requiring slots", () => {
    const levels = [{ level: 1, spellcasting: { cantrips: 4 } }];

    expect(resolveClassSpellSlotsForLevel(levels, 1)).toEqual({ cantrips: 4 });
  });

  it("uses the highest defined table at or below the character level", () => {
    const levels = [
      { level: 1, spellcasting: { cantrips: 2 } },
      { level: 5, spellcasting: { cantrips: 3, slots: { "1": 2 } } },
      { level: 11, spellcasting: { cantrips: 4 } },
    ];

    expect(resolveClassSpellSlotsForLevel(levels, 8)).toEqual({
      cantrips: 3,
      slots: { "1": 2 },
    });
  });

  it("returns undefined when no level at or below has spellcasting", () => {
    const levels = [{ level: 5, spellcasting: { cantrips: 2 } }];

    expect(resolveClassSpellSlotsForLevel(levels, 3)).toBeUndefined();
  });
});

describe("resolveSpellSlotsTableForLevel", () => {
  it("inherits slots from a previous level when the current row omits them", () => {
    const levels = [
      { level: 1, spellcasting: { spellsLearned: 4, slots: { "1": 2 } } },
      { level: 2, spellcasting: { spellsLearned: 1 } },
    ];

    expect(resolveSpellSlotsTableForLevel(levels, 2)).toEqual({ "1": 2 });
  });
});

describe("remainingCantripPicks", () => {
  it("returns the remaining picks when there is a gap", () => {
    expect(remainingCantripPicks(4, 3)).toBe(1);
  });

  it("returns 0 when the cap is already filled", () => {
    expect(remainingCantripPicks(3, 3)).toBe(0);
  });

  it("returns 0 when there is no cap", () => {
    expect(remainingCantripPicks(undefined, 0)).toBe(0);
    expect(remainingCantripPicks(0, 0)).toBe(0);
  });

  it("does not return a negative value", () => {
    expect(remainingCantripPicks(2, 5)).toBe(0);
  });
});

describe("hasCantripSpellChoice", () => {
  it("detects a persisted cantrip filter", () => {
    expect(hasCantripSpellChoice([{ choose: 1, filter: { level: 0, classes: "c1" } }])).toBe(true);
    expect(hasCantripSpellChoice([{ choose: 1, filter: { level: [0, 1] } }])).toBe(true);
    expect(hasCantripSpellChoice([{ choose: 1, query_filter: { level: 0 } }])).toBe(true);
    expect(hasCantripSpellChoice([{ choose: 1, level: 0 }])).toBe(true);
  });

  it("returns false when there is no cantrip choice", () => {
    expect(hasCantripSpellChoice(undefined)).toBe(false);
    expect(hasCantripSpellChoice([{ choose: 2, filter: { level: 1 } }])).toBe(false);
  });
});

describe("buildCantripSpellChoice", () => {
  it("builds a filter choice for cantrips of the class", () => {
    expect(buildCantripSpellChoice("class-1", 2)).toEqual({
      choose: 2,
      filter: { level: 0, classes: "class-1" },
    });
  });
});

describe("castableSpellLevels", () => {
  it("returns sorted spell levels with a positive slot count", () => {
    expect(castableSpellLevels({ "2": 2, "1": 4, "3": 0, "0": 1 })).toEqual([1, 2]);
  });

  it("returns an empty list when there are no slots", () => {
    expect(castableSpellLevels(undefined)).toEqual([]);
    expect(castableSpellLevels({})).toEqual([]);
  });
});

describe("spellsLearnedAtLevel", () => {
  const levels = [
    { level: 1, spellcasting: { spellsLearned: 4, slots: { "1": 2 } } },
    { level: 2, spellcasting: { slots: { "1": 3 } } },
    { level: 3, spellcasting: { spellsLearned: 1, slots: { "1": 4, "2": 2 } } },
  ];

  it("reads spellsLearned only from the exact level row", () => {
    expect(spellsLearnedAtLevel(levels, 1)).toBe(4);
    expect(spellsLearnedAtLevel(levels, 2)).toBe(0);
    expect(spellsLearnedAtLevel(levels, 3)).toBe(1);
  });

  it("does not inherit spellsLearned from a previous level", () => {
    expect(spellsLearnedAtLevel([
      { level: 1, spellcasting: { spellsLearned: 4, slots: { "1": 2 } } },
      { level: 2 },
    ], 2)).toBe(0);
  });
});

describe("hasKnownSpellChoice", () => {
  it("detects a persisted class-list filter for leveled spells", () => {
    expect(hasKnownSpellChoice(
      [{ choose: 1, filter: { level: [1, 2], classes: "c1" } }],
      "c1"
    )).toBe(true);
    expect(hasKnownSpellChoice(
      [{ choose: 1, query_filter: { level: 1, classes: "c1" } }],
      "c1"
    )).toBe(true);
    expect(hasKnownSpellChoice(
      [{ choose: 1, level: 1, class: "c1" }],
      "c1"
    )).toBe(true);
  });

  it("returns false for cantrips or a different class", () => {
    expect(hasKnownSpellChoice(
      [{ choose: 2, filter: { level: 0, classes: "c1" } }],
      "c1"
    )).toBe(false);
    expect(hasKnownSpellChoice(
      [{ choose: 1, filter: { level: [1, 2], classes: "other" } }],
      "c1"
    )).toBe(false);
    expect(hasKnownSpellChoice(undefined, "c1")).toBe(false);
  });
});

describe("buildKnownSpellChoice", () => {
  it("builds a filter choice for class spells of the given levels", () => {
    expect(buildKnownSpellChoice("class-1", 2, [1, 2])).toEqual({
      choose: 2,
      filter: { level: [1, 2], classes: "class-1" },
    });
  });
});

describe("buildSynthesizedKnownSpellChoice", () => {
  it("synthesizes a choice from spellsLearned and inherited slots", () => {
    const levels = [
      { level: 1, spellcasting: { spellsLearned: 4, slots: { "1": 2 } } },
      { level: 2, spellcasting: { spellsLearned: 1 } },
    ];

    expect(buildSynthesizedKnownSpellChoice("c1", levels, 2)).toEqual({
      choose: 1,
      filter: { level: [1], classes: "c1" },
    });
  });

  it("does not synthesize when the exact level has no spellsLearned", () => {
    const levels = [
      { level: 1, spellcasting: { spellsLearned: 4, slots: { "1": 2 } } },
      { level: 2, spellcasting: { slots: { "1": 3 } } },
    ];

    expect(buildSynthesizedKnownSpellChoice("c1", levels, 2)).toBeUndefined();
  });

  it("does not synthesize when there are no castable slots", () => {
    const levels = [
      { level: 1, spellcasting: { spellsLearned: 2, cantrips: 2 } },
    ];

    expect(buildSynthesizedKnownSpellChoice("c1", levels, 1)).toBeUndefined();
  });

  it("does not synthesize when a class-list choice is already persisted", () => {
    const levels = [
      { level: 1, spellcasting: { spellsLearned: 4, slots: { "1": 2 } } },
    ];

    expect(buildSynthesizedKnownSpellChoice(
      "c1",
      levels,
      1,
      [{ choose: 4, filter: { level: [1], classes: "c1" } }]
    )).toBeUndefined();
  });
});

describe("excludeKnownSpellOptions", () => {
  it("removes already known spells from options", () => {
    const result = excludeKnownSpellOptions(
      [{ choose: 1, options: [{ id: "a" }, { id: "b" }, { id: "c" }] }],
      ["b"]
    );
    expect(result[0].options.map(opt => opt.id)).toEqual(["a", "c"]);
  });
});

describe("validateLevelUpSpellPicks", () => {
  const choices = [
    { choose: 1, options: [{ id: "cantrip-1" }, { id: "cantrip-2" }] },
    { choose: 2, options: [{ id: "spell-1" }, { id: "spell-2" }, { id: "spell-3" }] },
  ];

  it("flattens valid picks aligned with each choice", () => {
    const result = validateLevelUpSpellPicks(
      choices,
      [["cantrip-1"], ["spell-1", "spell-2"]],
      []
    );
    expect(result).toEqual({ spellIds: ["cantrip-1", "spell-1", "spell-2"] });
  });

  it("allows omitting spells when there are no choices", () => {
    expect(validateLevelUpSpellPicks(undefined, undefined, [])).toEqual({ spellIds: [] });
    expect(validateLevelUpSpellPicks([], [], [])).toEqual({ spellIds: [] });
  });

  it("rejects extra spells when there are no choices", () => {
    const result = validateLevelUpSpellPicks(undefined, [["spell-1"]], []);
    expect(result).toEqual({ error: "Este nivel no ofrece elecciones de conjuros" });
  });

  it("rejects a missing group when choices exist", () => {
    const result = validateLevelUpSpellPicks(choices, [["cantrip-1"]], []);
    expect(result).toHaveProperty("error");
  });

  it("rejects the wrong number of picks for a choice", () => {
    const result = validateLevelUpSpellPicks(
      choices,
      [["cantrip-1"], ["spell-1"]],
      []
    );
    expect(result).toEqual({ error: "La elección 2 requiere 2 conjuro(s)" });
  });

  it("rejects ids that are not in the choice options", () => {
    const result = validateLevelUpSpellPicks(
      choices,
      [["spell-1"], ["spell-1", "spell-2"]],
      []
    );
    expect(result).toHaveProperty("error");
  });

  it("rejects duplicates and already known spells", () => {
    expect(
      validateLevelUpSpellPicks(choices, [["cantrip-1"], ["cantrip-1", "spell-2"]], [])
    ).toHaveProperty("error");
    expect(
      validateLevelUpSpellPicks(choices, [["cantrip-1"], ["spell-1", "spell-2"]], ["spell-1"])
    ).toHaveProperty("error");
  });
});

const wizardId = "wizard-id";
const preparedSpells = [
  { id: "spell-1", level: 1, classIds: [wizardId] },
  { id: "spell-2", level: 2, classIds: [wizardId] },
  { id: "cantrip-1", level: 0, classIds: [wizardId] },
  { id: "other-1", level: 1, classIds: ["cleric-id"] },
];

describe("validatePreparedSpellPicks", () => {
  it("accepts a subset of known leveled spells within the cap", () => {
    const result = validatePreparedSpellPicks({
      spellIds: ["spell-1", "spell-2"],
      cap: 5,
      preparedFrom: "known",
      knownIds: ["cantrip-1", "spell-1", "spell-2"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1, 2],
    });
    expect(result).toEqual({});
  });

  it("accepts an empty prepared list", () => {
    const result = validatePreparedSpellPicks({
      spellIds: [],
      cap: 5,
      preparedFrom: "known",
      knownIds: ["spell-1"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1],
    });
    expect(result).toEqual({});
  });

  it("rejects preparing more spells than the cap", () => {
    const result = validatePreparedSpellPicks({
      spellIds: ["spell-1", "spell-2"],
      cap: 1,
      preparedFrom: "known",
      knownIds: ["spell-1", "spell-2"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1, 2],
    });
    expect(result.error).toMatch(/más de 1/);
  });

  it("rejects cantrips and duplicates", () => {
    expect(validatePreparedSpellPicks({
      spellIds: ["cantrip-1"],
      cap: 5,
      preparedFrom: "known",
      knownIds: ["cantrip-1"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1],
    }).error).toMatch(/trucos/);

    expect(validatePreparedSpellPicks({
      spellIds: ["spell-1", "spell-1"],
      cap: 5,
      preparedFrom: "known",
      knownIds: ["spell-1"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1],
    }).error).toMatch(/duplicado/);
  });

  it("rejects known-source spells that are not in the known list", () => {
    const result = validatePreparedSpellPicks({
      spellIds: ["spell-1"],
      cap: 5,
      preparedFrom: "known",
      knownIds: ["spell-2"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1],
    });
    expect(result.error).toMatch(/conocidos/);
  });

  it("rejects classList spells that do not belong to the class", () => {
    const result = validatePreparedSpellPicks({
      spellIds: ["other-1"],
      cap: 5,
      preparedFrom: "classList",
      knownIds: [],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1],
    });
    expect(result.error).toMatch(/lista de esta clase/);
  });

  it("rejects spells above the available slot levels", () => {
    const result = validatePreparedSpellPicks({
      spellIds: ["spell-2"],
      cap: 5,
      preparedFrom: "known",
      knownIds: ["spell-2"],
      classId: wizardId,
      spells: preparedSpells,
      castableLevels: [1],
    });
    expect(result.error).toMatch(/ranuras/);
  });
});

