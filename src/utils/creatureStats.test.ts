import { describe, expect, it } from "vitest";
import { AttributeApi } from "../domain/types/attribute.types";
import { SkillApi } from "../domain/types/skill.types";
import {
  DEFAULT_ATTRIBUTE_MODIFIER_FORMULA,
  buildCreatureAttributes,
  buildCreatureSkills,
  resolveArmorClass,
  resolveAttackBonus,
  resolvePassivePerception
} from "./creatureStats";

const catalogAttributes: AttributeApi[] = [
  { id: "str", ruleset: "sys", name: "Fuerza", key: "str", abbreviation: "FUE" },
  { id: "dex", ruleset: "sys", name: "Destreza", key: "dex", abbreviation: "DES" },
  { id: "con", ruleset: "sys", name: "Constitución", key: "con", abbreviation: "CON" },
  { id: "int", ruleset: "sys", name: "Inteligencia", key: "int", abbreviation: "INT" },
  { id: "wis", ruleset: "sys", name: "Sabiduría", key: "wis", abbreviation: "SAB" },
  { id: "cha", ruleset: "sys", name: "Carisma", key: "cha", abbreviation: "CAR" }
];

const catalogSkills: SkillApi[] = [
  { id: "medicine", ruleset: "sys", name: "Medicina", key: "medicine", attributeScore: ["wis"] },
  { id: "persuasion", ruleset: "sys", name: "Persuasión", key: "persuasion", attributeScore: ["cha"] },
  { id: "religion", ruleset: "sys", name: "Religión", key: "religion", attributeScore: ["wis"] },
  { id: "perception", ruleset: "sys", name: "Percepción", key: "perception", attributeScore: ["wis"] }
];

describe("creatureStats", () => {
  const attributes = buildCreatureAttributes(
    [
      { key: "str", value: 10 },
      { key: "dex", value: 10 },
      { key: "con", value: 12 },
      { key: "int", value: 13 },
      { key: "wis", value: 16 },
      { key: "cha", value: 13 }
    ],
    catalogAttributes,
    DEFAULT_ATTRIBUTE_MODIFIER_FORMULA
  );

  const skills = buildCreatureSkills({
    catalog: catalogSkills,
    skillBonuses: [
      { skillId: "medicine", bonus: 7 },
      { skillId: "persuasion", bonus: 3 },
      { skillId: "religion", bonus: 4 }
    ]
  });

  it("calcula los modificadores y habilidades del sacerdote", () => {
    expect(attributes.find(attribute => attribute.key === "wis")?.modifier).toBe(3);
    expect(attributes.find(attribute => attribute.key === "str")?.modifier).toBe(0);
    expect(attributes.find(attribute => attribute.key === "cha")?.modifier).toBe(1);

    expect(skills.map(skill => skill.key)).toEqual(["medicine", "persuasion", "religion"]);
    expect(skills.find(skill => skill.key === "medicine")?.modifier).toBe(7);
    expect(skills.find(skill => skill.key === "persuasion")?.modifier).toBe(3);
    expect(skills.find(skill => skill.key === "religion")?.modifier).toBe(4);
  });

  it("resuelve percepción pasiva, CA y el ataque de la maza", () => {
    expect(resolvePassivePerception(skills, attributes)).toBe(13);
    expect(resolveArmorClass({ value: 13 }, attributes)).toBe(13);
    expect(resolveArmorClass(undefined, attributes)).toBe(10);
    expect(resolveAttackBonus({ attributeKey: "str" }, attributes, 2)).toBe(2);
  });

  it("respeta los overrides de percepción pasiva y bonos de ataque", () => {
    expect(resolvePassivePerception(skills, attributes, 15)).toBe(15);
    expect(resolveAttackBonus({ attributeKey: "str", bonus: 6 }, attributes, 2)).toBe(6);
  });
});
