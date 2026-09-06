import { describe, it, expect } from "vitest";
import {
  evaluateFormula,
  evaluatePassiveSkillFormula,
  enrichSkillsWithPassive,
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
    expect(validateSystemFormula("10 + @skills.sleight-of-hand.totalModifier")).toBeUndefined();
    expect(validateSystemFormula("10 + @skills.animal-handling.totalModifier")).toBeUndefined();
  });

  it("rejects invalid tokens", () => {
    expect(validateSystemFormula("@unknown.token")).toBeDefined();
    expect(validateSystemFormula("10 + @skills.{skillName}.totalModifier")).toBeDefined();
  });

  it("accepts attribute modifier formulas", () => {
    expect(validateAttributeModifierFormula("Math.floor((value - 10) / 2)")).toBeUndefined();
  });

  it("accepts weapon formulas with weapon tokens and conditionals", () => {
    expect(
      validateSystemFormula(
        "@weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus",
        { allowWeaponTokens: true }
      )
    ).toBeUndefined();
    expect(
      validateSystemFormula(
        "@weapon.isRanged ? @attributes.dex.modifier : @attributes.str.modifier",
        { allowWeaponTokens: true }
      )
    ).toBeUndefined();
  });

  it("rejects weapon tokens outside weapon formulas", () => {
    expect(validateSystemFormula("@weapon.attributeModifier")).toBeDefined();
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

  it("evaluates hp level-up formula with @class.hitDie as rolled increase", () => {
    const result = evaluateFormula(
      "@class.hitDie + @attributes.con.modifier",
      sampleAttributes,
      { hpIncrease: 5 },
      { classVariables: { hitDie: 5 } }
    );
    expect(result).toBe(7);
  });

  it("evaluates hp level-up formula with @hpIncrease flat variable", () => {
    const result = evaluateFormula(
      "@hpIncrease + @attributes.con.modifier",
      sampleAttributes,
      { hpIncrease: 6 }
    );
    expect(result).toBe(8);
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

  it("evaluates passive skill formula with hyphenated skill key", () => {
    const hyphenatedSkills = [
      {
        id: "2",
        key: "sleight-of-hand",
        name: "Juego de manos",
        description: "",
        attributeScore: ["dex"],
        value: 1,
        modifier: 4,
      },
      {
        id: "3",
        key: "animal-handling",
        name: "Trato con animales",
        description: "",
        attributeScore: ["wis"],
        value: 1,
        modifier: 2,
      },
    ];

    expect(
      evaluatePassiveSkillFormula(
        "10 + @skills.{skillName}.totalModifier",
        "sleight-of-hand",
        { attributes: sampleAttributes, skills: hyphenatedSkills }
      )
    ).toBe(14);

    expect(
      evaluateFormula(
        "10 + @skills.animal-handling.totalModifier",
        sampleAttributes,
        undefined,
        { skills: hyphenatedSkills }
      )
    ).toBe(12);
  });

  it("enriches skills with passive values", () => {
    const skills = enrichSkillsWithPassive(
      "10 + @skills.{skillName}.totalModifier",
      sampleSkills,
      { attributes: sampleAttributes }
    );
    expect(skills[0].passive).toBe(15);
  });

  it("does not add passive when formula is missing", () => {
    const skills = enrichSkillsWithPassive(undefined, sampleSkills, { attributes: sampleAttributes });
    expect(skills[0].passive).toBeUndefined();
  });

  it("evaluates weapon attack formula with tokens", () => {
    const result = evaluateFormula(
      "@weapon.attributeModifier + @weapon.isProficient * @proficiencyBonus + @weapon.isMagic",
      sampleAttributes,
      { proficiencyBonus: 2 },
      {
        weapon: {
          attributeModifier: 3,
          attributeValue: 16,
          isProficient: 1,
          isMagic: 1,
          isRanged: 0,
          isTwoHanded: 0,
        },
      }
    );
    expect(result).toBe(6);
  });

  it("evaluates weapon formula with ternary conditional", () => {
    const result = evaluateFormula(
      "@weapon.isRanged ? @attributes.dex.modifier : @attributes.str.modifier",
      sampleAttributes,
      undefined,
      {
        weapon: {
          attributeModifier: 0,
          attributeValue: 0,
          isProficient: 0,
          isMagic: 0,
          isRanged: 1,
          isTwoHanded: 0,
        },
      }
    );
    expect(result).toBe(2);
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
    attackBonusFormula: "child-attack",
    meleeAttackAttributes: ["str", "dex"],
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

  it("inherits attackBonusFormula and meleeAttackAttributes from child", () => {
    const config = mergeRulesFromAncestry([child, parent, grandparent]);
    expect(config.attackBonusFormula).toBe("child-attack");
    expect(config.meleeAttackAttributes).toEqual(["str", "dex"]);
  });
});
