import { describe, expect, it } from "vitest";
import {
  applySkillProficiencyChoices,
  collectChosenSkillProficiencies,
  collectTraitSkillProficiencies,
  listPendingSkillProficiencyChoices,
  maxSkillProficiencyValue
} from "./applyTraitSkillProficiencies";

const stealth = { id: "skill-id-stealth", attributeScore: ["dex"] };
const athletics = { id: "skill-id-athletics", attributeScore: ["str"] };
const arcana = { id: "skill-id-arcana", attributeScore: ["int"] };

describe("maxSkillProficiencyValue", () => {
  it("raises untrained skills to half proficiency", () => {
    expect(maxSkillProficiencyValue(0, stealth, [{ value: 0.5 }])).toBe(0.5);
  });

  it("does not lower proficiency or expertise", () => {
    expect(maxSkillProficiencyValue(1, stealth, [{ value: 0.5 }])).toBe(1);
    expect(maxSkillProficiencyValue(2, stealth, [{ value: 0.5 }])).toBe(2);
  });

  it("filters by attributeKeys", () => {
    const overlay = { value: 0.5 as const, attributeKeys: ["str", "dex", "con"] };
    expect(maxSkillProficiencyValue(0, stealth, [overlay])).toBe(0.5);
    expect(maxSkillProficiencyValue(0, athletics, [overlay])).toBe(0.5);
    expect(maxSkillProficiencyValue(0, arcana, [overlay])).toBe(0);
  });

  it("filters by skillIds", () => {
    const overlay = { value: 2 as const, skillIds: ["skill-id-stealth"] };
    expect(maxSkillProficiencyValue(0, stealth, [overlay])).toBe(2);
    expect(maxSkillProficiencyValue(0, athletics, [overlay])).toBe(0);
  });

  it("requires both filters when they are present", () => {
    const overlay = {
      value: 1 as const,
      skillIds: ["skill-id-stealth"],
      attributeKeys: ["str"]
    };
    expect(maxSkillProficiencyValue(0, stealth, [overlay])).toBe(0);
    expect(maxSkillProficiencyValue(0, athletics, [overlay])).toBe(0);
  });

  it("uses max across overlapping overlays", () => {
    const value = maxSkillProficiencyValue(0, stealth, [
      { value: 0.5 },
      { value: 2, skillIds: ["skill-id-stealth"] }
    ]);
    expect(value).toBe(2);
  });
});

describe("skillProficiencyChoices", () => {
  const expertise = {
    id: "trait-expertise",
    skillProficiencyChoices: [{
      key: "expertise",
      value: 2 as const,
      from: "proficient" as const,
      grants: [
        { atLevel: 3, choose: 2 },
        { atLevel: 10, choose: 2 }
      ]
    }]
  };

  const proficientIds = ["skill-id-stealth", "skill-id-athletics", "skill-id-arcana", "skill-id-history"];

  it("lists two pending picks at class level 3", () => {
    const pending = listPendingSkillProficiencyChoices({
      classLevel: 3,
      grantedTraits: [expertise],
      proficientIds
    });
    expect(pending).toEqual([{
      traitId: "trait-expertise",
      key: "expertise",
      add: 2,
      value: 2,
      chosen: [],
      optionIds: proficientIds
    }]);
  });

  it("adds two more picks at class level 10", () => {
    const pending = listPendingSkillProficiencyChoices({
      existing: { "trait-expertise": { expertise: ["skill-id-stealth", "skill-id-athletics"] } },
      classLevel: 10,
      grantedTraits: [expertise],
      proficientIds
    });
    expect(pending[0]?.add).toBe(2);
    expect(pending[0]?.chosen).toEqual(["skill-id-stealth", "skill-id-athletics"]);
    expect(pending[0]?.optionIds).toEqual(["skill-id-arcana", "skill-id-history"]);
  });

  it("rejects a skill that is not proficient and a list that drops previous picks", () => {
    const stored = {
      existing: { "trait-expertise": { expertise: ["skill-id-stealth", "skill-id-athletics"] } },
      classLevel: 10,
      grantedTraits: [expertise],
      proficientIds
    };
    expect(applySkillProficiencyChoices({
      ...stored,
      incoming: { "trait-expertise": { expertise: ["skill-id-stealth", "skill-id-athletics", "missing", "skill-id-arcana"] } }
    })).toEqual({ error: "La skill missing no es una competencia del personaje" });
    expect(applySkillProficiencyChoices({
      ...stored,
      incoming: { "trait-expertise": { expertise: ["skill-id-arcana", "skill-id-history", "skill-id-stealth", "skill-id-athletics"] } }
    })).toMatchObject({ error: expect.stringMatching(/conservar/) });
  });

  it("stores growth and builds overlays only for still-proficient skills", () => {
    const applied = applySkillProficiencyChoices({
      classLevel: 3,
      grantedTraits: [expertise],
      proficientIds,
      incoming: { "trait-expertise": { expertise: ["skill-id-stealth", "skill-id-athletics"] } }
    });
    expect(applied).toEqual({
      traitChoices: { "trait-expertise": { expertise: ["skill-id-stealth", "skill-id-athletics"] } }
    });
    if ("error" in applied) throw new Error(applied.error);

    expect(collectChosenSkillProficiencies(
      [expertise],
      applied.traitChoices,
      ["skill-id-athletics"]
    )).toEqual([{ value: 2, skillIds: ["skill-id-athletics"] }]);
  });
});

describe("collectTraitSkillProficiencies", () => {
  it("flattens overlays from traits", () => {
    const overlays = collectTraitSkillProficiencies([
      { skillProficiencies: [{ value: 0.5 }] },
      { skillProficiencies: [{ value: 2, skillIds: ["skill-id-stealth"] }] },
      {}
    ]);
    expect(overlays).toEqual([
      { value: 0.5 },
      { value: 2, skillIds: ["skill-id-stealth"] }
    ]);
  });
});
