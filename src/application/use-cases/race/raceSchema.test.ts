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

describe("CreateRaceSchema levels", () => {
  const breathId = "507f1f77bcf86cd799439099";

  it("accepts unique levels from 1 to 20 with trait data", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      levels: [
        { level: 1, traits_data: { [breathId]: { "{dice}": "2d6" } } },
        { level: 6, traits_data: { [breathId]: { "{dice}": "3d6" } } }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects a trait id list on a race level", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      levels: [{ level: 6, traits: [breathId], traits_data: { [breathId]: { "{dice}": "3d6" } } }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects a repeated level and a level outside 1 to 20", () => {
    const repeated = CreateRaceSchema.safeParse({
      ...baseRace,
      levels: [{ level: 6 }, { level: 6 }]
    });
    const high = CreateRaceSchema.safeParse({
      ...baseRace,
      levels: [{ level: 21 }]
    });

    expect(repeated.success).toBe(false);
    expect(high.success).toBe(false);
  });

  it("accepts null to clear levels on update", () => {
    const result = UpdateRaceSchema.safeParse({ levels: null });
    expect(result.success).toBe(true);
  });
});

describe("CreateRaceSchema ability_bonus_choices and skill_choices", () => {
  it("accepts choose-only, options, and filter modes", () => {
    const chooseOnly = CreateRaceSchema.safeParse({
      ...baseRace,
      ability_bonus_choices: { choose: 2 },
      skill_choices: { choose: 2 }
    });
    expect(chooseOnly.success).toBe(true);
    if (chooseOnly.success) {
      expect(chooseOnly.data.ability_bonus_choices).toEqual({ choose: 2 });
      expect(chooseOnly.data.skill_choices).toEqual({ choose: 2 });
    }

    const withOptions = CreateRaceSchema.safeParse({
      ...baseRace,
      ability_bonus_choices: { choose: 2, options: ["dex", "int"] },
      skill_choices: { choose: 1, options: [proficiencyId] }
    });
    expect(withOptions.success).toBe(true);
    if (withOptions.success) {
      expect(withOptions.data.ability_bonus_choices).toEqual({
        choose: 2,
        options: ["dex", "int"]
      });
      expect(withOptions.data.skill_choices).toEqual({
        choose: 1,
        options: [proficiencyId]
      });
    }

    const withFilter = CreateRaceSchema.safeParse({
      ...baseRace,
      ability_bonus_choices: { choose: 1, filter: { key: "cha" } },
      skill_choices: { choose: 1, filter: { key: "athletics" } }
    });
    expect(withFilter.success).toBe(true);
    if (withFilter.success) {
      expect(withFilter.data.ability_bonus_choices).toEqual({
        choose: 1,
        filter: { key: "cha" }
      });
      expect(withFilter.data.skill_choices).toEqual({
        choose: 1,
        filter: { key: "athletics" }
      });
    }
  });

  it("accepts null to clear the choices", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      ability_bonus_choices: null,
      skill_choices: null
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ability_bonus_choices).toBeNull();
      expect(result.data.skill_choices).toBeNull();
    }
  });

  it("rejects choose less than 1", () => {
    const ability = CreateRaceSchema.safeParse({
      ...baseRace,
      ability_bonus_choices: { choose: 0, options: ["dex"] }
    });
    const skill = CreateRaceSchema.safeParse({
      ...baseRace,
      skill_choices: { choose: 0, options: [proficiencyId] }
    });

    expect(ability.success).toBe(false);
    expect(skill.success).toBe(false);
  });

  it("strips response keys query_type and query_filter", () => {
    const result = CreateRaceSchema.safeParse({
      ...baseRace,
      ability_bonus_choices: { choose: 2, query_type: "all", query_filter: { key: "cha" } },
      skill_choices: { choose: 2, query_type: "filter", query_filter: { key: "athletics" } }
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ability_bonus_choices).toEqual({ choose: 2 });
      expect(result.data.skill_choices).toEqual({ choose: 2 });
    }
  });
});

describe("UpdateRaceSchema ability_bonus_choices and skill_choices", () => {
  it("accepts null to clear the choices", () => {
    const result = UpdateRaceSchema.safeParse({
      ability_bonus_choices: null,
      skill_choices: null
    });

    expect(result.success).toBe(true);
  });

  it("rejects choose less than 1", () => {
    const result = UpdateRaceSchema.safeParse({
      ability_bonus_choices: { choose: 0 }
    });

    expect(result.success).toBe(false);
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

  it("accepts view summary and an optional ruleset", () => {
    const result = GetRacesQuerySchema.safeParse({
      ruleset: "sys-1",
      view: "summary",
      playable: "true"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.view).toBe("summary");
      expect(result.data.ruleset).toBe("sys-1");
    }
  });
});
