import { CharacterAttributeApi } from "../domain/types/attribute.types";
import {
  CharacterEquipmentApi,
  EquipmentInstanceApi,
} from "../domain/types/equipment.types";
import { ProficiencyApi } from "../domain/types/proficiencies.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import { evaluateFormula } from "./formulaEvaluator";
import {
  isRangedWeapon,
  resolveWeaponAttributeStats,
  weaponHasTwoHandedProperty,
} from "./weaponAttackAttributes";

export interface EnrichEquipmentCombatBonusesInput {
  equipment: EquipmentInstanceApi[];
  attributes: CharacterAttributeApi[];
  proficiencies: ProficiencyApi[];
  proficiencyBonus: number;
  level: number;
  rules: Pick<
    SystemRulesConfig,
    | "attackBonusFormula"
    | "damageBonusFormula"
    | "meleeAttackAttributes"
    | "rangedAttackAttributes"
  >;
}

export function isEquipmentProficient(
  equipment: EquipmentInstanceApi,
  proficiencies: ProficiencyApi[]
): boolean {
  const required = equipment.proficiencies ?? [];
  if (required.length === 0) {
    return true;
  }

  return proficiencies.some(proficiency =>
    required.some(equipmentProficiency => equipmentProficiency.id === proficiency.id)
  );
}

function buildWeaponContext(
  equipment: EquipmentInstanceApi,
  attributes: CharacterAttributeApi[],
  proficiencies: ProficiencyApi[],
  rules: Pick<SystemRulesConfig, "meleeAttackAttributes" | "rangedAttackAttributes">
) {
  const weapon = equipment.weapon;
  if (!weapon) return undefined;

  const stats = resolveWeaponAttributeStats(weapon, rules, attributes);
  const propertyIds = (weapon.properties ?? [])
    .map(property => property.id)
    .filter((id): id is string => Boolean(id));

  return {
    attributeModifier: stats.attributeModifier,
    attributeValue: stats.attributeValue,
    isProficient: isEquipmentProficient(equipment, proficiencies) ? 1 : 0,
    isMagic: equipment.isMagic ? 1 : 0,
    isRanged: isRangedWeapon(weapon) ? 1 : 0,
    isTwoHanded: weaponHasTwoHandedProperty(weapon) ? 1 : 0,
    propertyIds,
  };
}

export function enrichEquipmentWithCombatBonuses(
  input: EnrichEquipmentCombatBonusesInput
): CharacterEquipmentApi[] {
  const { equipment, attributes, proficiencies, proficiencyBonus, level, rules } = input;

  const variables = {
    proficiencyBonus,
    level,
  };

  const hasCombatFormulas = Boolean(rules.attackBonusFormula || rules.damageBonusFormula);

  return equipment.map(item => {
    const isProficient = isEquipmentProficient(item, proficiencies);
    const enriched: CharacterEquipmentApi = {
      ...item,
      isProficient,
    };

    if (!hasCombatFormulas || !item.weapon) {
      return enriched;
    }

    const weaponContext = buildWeaponContext(item, attributes, proficiencies, rules);
    if (!weaponContext) {
      return enriched;
    }

    const attackBonus = rules.attackBonusFormula
      ? evaluateFormula(rules.attackBonusFormula, attributes, variables, { weapon: weaponContext })
      : undefined;

    const damageBonus = rules.damageBonusFormula
      ? evaluateFormula(rules.damageBonusFormula, attributes, variables, { weapon: weaponContext })
      : undefined;

    return {
      ...enriched,
      ...(attackBonus !== undefined ? { attackBonus } : {}),
      ...(damageBonus !== undefined ? { damageBonus } : {}),
    };
  });
}
