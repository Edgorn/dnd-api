import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { AttributeApi } from "../domain/types/attribute.types";
import {
  CreatureAttack,
  CreatureSkillBonus
} from "../domain/types/creature.types";
import { SkillApi, SkillPersonajeApi } from "../domain/types/skill.types";
import { evaluateAttributeModifier } from "./formulaEvaluator";

export const DEFAULT_ATTRIBUTE_MODIFIER_FORMULA = "Math.floor((value - 10) / 2)";

const PERCEPTION_SKILL_KEYS = ["perception", "percepcion"];

export function abilityModifier(value: number, formula: string): number {
  return evaluateAttributeModifier(formula, value) ?? 0;
}

export function buildCreatureAttributes(
  stored: { key: string; value: number }[],
  catalog: AttributeApi[],
  formula: string
): CharacterAttributeApi[] {
  return stored.map(item => {
    const match = catalog.find(attribute => attribute.key === item.key || attribute.id === item.key);
    return {
      id: match?.id ?? item.key,
      name: match?.name ?? item.key,
      description: match?.description,
      key: match?.key ?? item.key,
      abbreviation: match?.abbreviation,
      icon: match?.icon,
      value: item.value,
      modifier: abilityModifier(item.value, formula)
    };
  });
}

export function buildCreatureSkills(input: {
  catalog: SkillApi[];
  skillBonuses?: CreatureSkillBonus[] | null;
}): SkillPersonajeApi[] {
  const skills: SkillPersonajeApi[] = [];
  const seen = new Set<string>();

  for (const bonus of input.skillBonuses ?? []) {
    const skill = input.catalog.find(item => item.id === bonus.skillId || item.key === bonus.skillId);
    if (!skill || seen.has(skill.id)) continue;
    seen.add(skill.id);

    skills.push({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      key: skill.key,
      attributeScore: skill.attributeScore || [],
      value: 0,
      modifier: bonus.bonus
    });
  }

  return skills;
}

export function resolvePassivePerception(
  skills: SkillPersonajeApi[],
  attributes: CharacterAttributeApi[],
  override?: number
): number {
  if (override !== undefined) return override;

  const perception = skills.find(skill => PERCEPTION_SKILL_KEYS.includes(skill.key));
  if (perception) return 10 + perception.modifier;

  const wisdom = attributes.find(attribute => attribute.key === "wis");
  return 10 + (wisdom?.modifier ?? 0);
}

export function resolveArmorClass(
  armorClass: { value: number } | null | undefined,
  attributes: CharacterAttributeApi[]
): number {
  if (armorClass && armorClass.value !== undefined && armorClass.value !== null) {
    return armorClass.value;
  }

  const dexterity = attributes.find(attribute => attribute.key === "dex");
  return 10 + (dexterity?.modifier ?? 0);
}

export function resolveAttackBonus(
  attack: Pick<CreatureAttack, "attributeKey" | "bonus">,
  attributes: CharacterAttributeApi[],
  profBonus: number
): number {
  if (attack.bonus !== undefined) return attack.bonus;
  const modifier = attributes.find(attribute => attribute.key === attack.attributeKey)?.modifier ?? 0;
  return modifier + profBonus;
}
