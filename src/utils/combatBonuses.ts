import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";
import { ProficiencyApi } from "../domain/types/proficiencies.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import { evaluateFormula } from "./formulaEvaluator";
import {
  isRangedWeapon,
  resolveWeaponAttributeStats,
  weaponHasTwoHandedProperty,
} from "./weaponAttackAttributes";

export interface EnrichEquipmentCombatBonusesInput {
  equipment: CharacterEquipmentApi[];
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

function isWeaponProficient(
  equipment: CharacterEquipmentApi,
  proficiencies: ProficiencyApi[]
): boolean {
  return proficiencies.some(proficiency =>
    equipment.proficiencies?.some(equipmentProficiency => equipmentProficiency.id === proficiency.id)
  );
}

function buildWeaponContext(
  equipment: CharacterEquipmentApi,
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
    isProficient: isWeaponProficient(equipment, proficiencies) ? 1 : 0,
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

  if (!rules.attackBonusFormula && !rules.damageBonusFormula) {
    return equipment;
  }

  const variables = {
    proficiencyBonus,
    level,
  };

  return equipment.map(item => {
    if (!item.weapon) {
      return item;
    }

    const weaponContext = buildWeaponContext(item, attributes, proficiencies, rules);
    if (!weaponContext) {
      return item;
    }

    const attackBonus = rules.attackBonusFormula
      ? evaluateFormula(rules.attackBonusFormula, attributes, variables, { weapon: weaponContext })
      : undefined;

    const damageBonus = rules.damageBonusFormula
      ? evaluateFormula(rules.damageBonusFormula, attributes, variables, { weapon: weaponContext })
      : undefined;

    return {
      ...item,
      ...(attackBonus !== undefined ? { attackBonus } : {}),
      ...(damageBonus !== undefined ? { damageBonus } : {}),
    };
  });
}
