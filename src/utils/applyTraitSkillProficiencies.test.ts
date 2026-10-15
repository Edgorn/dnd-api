import { describe, expect, it } from "vitest";
import {
  collectTraitSkillProficiencies,
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

  it("keeps a triple overlay", () => {
    expect(maxSkillProficiencyValue(2, stealth, [{ value: 3, skillIds: ["skill-id-stealth"] }])).toBe(3);
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

describe("collectTraitSkillProficiencies", () => {
  it("flattens overlays from traits", () => {
    const overlays = collectTraitSkillProficiencies([
      { skillProficiencies: [{ value: 0.5 }] },
      { skillProficiencies: [{ value: 2, skillIds: ["skill-id-stealth"] }] },
    ]);
    expect(overlays).toEqual([
      { value: 0.5 },
      { value: 2, skillIds: ["skill-id-stealth"] }
    ]);
  });
});
