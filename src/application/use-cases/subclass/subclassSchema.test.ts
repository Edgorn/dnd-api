import { describe, it, expect } from "vitest";
import { CreateSubclassSchema, UpdateSubclassSchema } from "../../../infrastructure/http/schemas/subclass.schema";

const classId = "507f1f77bcf86cd799439011";
const traitId = "507f1f77bcf86cd799439012";

describe("CreateSubclassSchema", () => {
  it("accepts a subclass with slim levels", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Escuela de Evocación",
      description: ["Haces hincapié en el estudio de la magia elemental."],
      levels: [
        { level: 2, traits: [traitId] },
        { level: 6, traits: [traitId], traits_data: { [traitId]: { uses: "1" } } }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid classId", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId: "wizard",
      name: "Escuela de Evocación"
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate levels", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Escuela de Evocación",
      levels: [
        { level: 2, traits: [traitId] },
        { level: 2, traits: [traitId] }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects traits that are not ObjectIds", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Escuela de Evocación",
      levels: [{ level: 2, traits: ["esculpir-conjuros"] }]
    });

    expect(result.success).toBe(false);
  });

  it("accepts skill_choices with choose-only, options, and filter", () => {
    const chooseOnly = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Colegio del Conocimiento",
      levels: [{ level: 3, skill_choices: { choose: 3 } }]
    });
    expect(chooseOnly.success).toBe(true);
    if (chooseOnly.success) {
      expect(chooseOnly.data.levels?.[0].skill_choices).toEqual({ choose: 3 });
    }

    const withOptions = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Colegio del Conocimiento",
      levels: [{ level: 3, skill_choices: { choose: 2, options: [traitId] } }]
    });
    expect(withOptions.success).toBe(true);

    const withFilter = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Colegio del Conocimiento",
      levels: [{ level: 3, skill_choices: { choose: 1, filter: { key: "history" } } }]
    });
    expect(withFilter.success).toBe(true);
  });

  it("accepts skillProficiencyChoices and extra spell_choices", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Colegio del Saber",
      levels: [{
        level: 6,
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
    expect(result.success).toBe(true);
  });

  it("accepts expandedSpells ObjectIds", () => {
    const spellId = "507f1f77bcf86cd799439013";
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "El Infernal",
      expandedSpells: [spellId, traitId]
    });
    expect(result.success).toBe(true);
  });

  it("rejects expandedSpells that are not ObjectIds", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "El Infernal",
      expandedSpells: ["manos-ardientes"]
    });
    expect(result.success).toBe(false);
  });

  it("rejects skill_choices with choose less than 1", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Colegio del Conocimiento",
      levels: [{ level: 3, skill_choices: { choose: 0 } }]
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateSubclassSchema", () => {
  it("accepts a partial update", () => {
    const result = UpdateSubclassSchema.safeParse({
      name: "Escuela de Evocación"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = UpdateSubclassSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts null skill_choices on a level to clear the choice", () => {
    const result = UpdateSubclassSchema.safeParse({
      levels: [{ level: 3, skill_choices: null }]
    });
    expect(result.success).toBe(true);
  });

  it("accepts null expandedSpells to clear the list", () => {
    const result = UpdateSubclassSchema.safeParse({
      expandedSpells: null
    });
    expect(result.success).toBe(true);
  });
});
