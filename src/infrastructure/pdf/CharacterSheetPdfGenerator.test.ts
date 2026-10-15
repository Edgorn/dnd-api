import { describe, expect, it } from "vitest";
import { isPdfSkillProficiencyChecked } from "./CharacterSheetPdfGenerator";

describe("isPdfSkillProficiencyChecked", () => {
  it("does not check half proficiency from jack of all trades", () => {
    expect(isPdfSkillProficiencyChecked(0.5)).toBe(false);
  });

  it("does not check untrained skills", () => {
    expect(isPdfSkillProficiencyChecked(0)).toBe(false);
    expect(isPdfSkillProficiencyChecked(undefined)).toBe(false);
  });

  it("checks proficiency and expertise", () => {
    expect(isPdfSkillProficiencyChecked(1)).toBe(true);
    expect(isPdfSkillProficiencyChecked(2)).toBe(true);
  });
});
