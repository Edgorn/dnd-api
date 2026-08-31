import { describe, it, expect } from "vitest";
import {
  evaluateFormula,
  evaluatePassiveSkillFormula,
  buildPassiveSkillsMap,
} from "./formulaEvaluator";
import { validateSystemFormula, validateAttributeModifierFormula } from "./formulaValidation";
import { mergeRulesFromAncestry } from "./systemRulesMerge";
import { System } from "../domain/types/system.types";
import { ObjectId } from "mongoose";

const sampleAttributes = [
  { key: "str", name: "Fuerza", value: 16, modifier: 3 },
  { key: "dex", name: "Destreza", value: 14, modifier: 2 },
  { key: "con", name: "Constitución", value: 15, modifier: 2 },
];

const sampleSkills = [
  {
    id: "1",
    key: "perception",
    name: "Percepción",
    description: "",
    attributeScore: ["wis"],
    value: 1,
    modifier: 5,
  },
];

describe("formulaValidation", () => {
  it("accepts valid system formulas", () => {
    expect(validateSystemFormula("max(@class.hitDie) + @attributes.con.modifier")).toBeUndefined();
    expect(validateSystemFormula("10 + @attributes.dex.modifier")).toBeUndefined();
    expect(
      validateSystemFormula("10 + @skills.{skillName}.totalModifier", { allowSkillNamePlaceholder: true })
    ).toBeUndefined();
  });

  it("rejects invalid tokens", () => {
    expect(validateSystemFormula("@unknown.token")).toBeDefined();
    expect(validateSystemFormula("10 + @skills.{skillName}.totalModifier")).toBeDefined();
  });

  it("accepts attribute modifier formulas", () => {
    expect(validateAttributeModifierFormula("Math.floor((value - 10) / 2)")).toBeUndefined();
  });
});

describe("formulaEvaluator", () => {
  it("evaluates hp initial formula with max and class hit die", () => {
    const result = evaluateFormula(
      "max(@class.hitDie) + @attributes.con.modifier",
      sampleAttributes,
      undefined,
      { classVariables: { hitDie: 8 } }
    );
    expect(result).toBe(10);
  });

  it("evaluates base AC formula", () => {
    const result = evaluateFormula("10 + @attributes.dex.modifier", sampleAttributes);
    expect(result).toBe(12);
  });

  it("evaluates carrying capacity formula", () => {
    const result = evaluateFormula("@attributes.str.value * 15", sampleAttributes);
    expect(result).toBe(240);
  });

  it("evaluates passive skill formula template", () => {
    const result = evaluatePassiveSkillFormula(
      "10 + @skills.{skillName}.totalModifier",
      "perception",
      { attributes: sampleAttributes, skills: sampleSkills }
    );
    expect(result).toBe(15);
  });

  it("builds passive skills map", () => {
    const map = buildPassiveSkillsMap(
      "10 + @skills.{skillName}.totalModifier",
      sampleSkills,
      { attributes: sampleAttributes }
    );
    expect(map.perception).toBe(15);
  });
});

describe("mergeRulesFromAncestry", () => {
  const baseId = new ObjectId();

  const grandparent: System = {
    _id: new ObjectId(),
    name: "Grandparent",
    description: "",
    publisher: "pub",
    isOpen: false,
    isBase: true,
    xpProgression: [0, 100],
    proficiencyProgression: [2, 3],
    hpInitialFormula: "grandparent-hp",
  };

  const parent: System = {
    _id: new ObjectId(),
    name: "Parent",
    description: "",
    publisher: "pub",
    isOpen: false,
    isBase: false,
    parentId: grandparent._id,
    proficiencyProgression: [2, 4],
  };

  const child: System = {
    _id: baseId,
    name: "Child",
    description: "",
    publisher: "pub",
    isOpen: false,
    isBase: false,
    parentId: parent._id,
    xpProgression: [0, 500],
    hpInitialFormula: "child-hp",
  };

  it("child overrides parent xpProgression", () => {
    const config = mergeRulesFromAncestry([child, parent, grandparent]);
    expect(config.xpProgression).toEqual([0, 500]);
  });

  it("inherits proficiencyProgression when child has none", () => {
    const config = mergeRulesFromAncestry([child, parent, grandparent]);
    expect(config.proficiencyProgression).toEqual([2, 4]);
  });

  it("resolves scalar formulas from nearest ancestor", () => {
    const config = mergeRulesFromAncestry([child, parent, grandparent]);
    expect(config.hpInitialFormula).toBe("child-hp");
  });

  it("inherits from grandparent when intermediate has empty array", () => {
    const childWithoutXp: System = { ...child, xpProgression: [] };
    const config = mergeRulesFromAncestry([childWithoutXp, parent, grandparent]);
    expect(config.xpProgression).toEqual([0, 100]);
  });
});
