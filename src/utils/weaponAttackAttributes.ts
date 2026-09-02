import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { Property } from "../domain/types/property.types";
import { WeaponApi } from "../domain/types/equipment.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import {
  DEFAULT_MELEE_ATTACK_ATTRIBUTES,
  DEFAULT_RANGED_ATTACK_ATTRIBUTES,
} from "./systemRulesMerge";

const RANGED_RANGE_LABELS = new Set([
  "distancia",
  "a distancia",
  "ranged",
  "distance",
]);

const FINESSE_PROPERTY_NAMES = new Set(["sutil", "sutileza", "finesse"]);

const TWO_HANDED_PROPERTY_NAMES = new Set([
  "a dos manos",
  "dos manos",
  "two-handed",
  "two handed",
]);

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isRangedWeapon(weapon?: Pick<WeaponApi, "range">): boolean {
  if (!weapon?.range) return false;
  return RANGED_RANGE_LABELS.has(normalizeLabel(weapon.range));
}

function resolvePropertyAttackAttributes(property: Property): string[] {
  if (property.attackAttributes && property.attackAttributes.length > 0) {
    return property.attackAttributes;
  }

  const normalizedName = normalizeLabel(property.name);
  if (FINESSE_PROPERTY_NAMES.has(normalizedName)) {
    return ["dex"];
  }

  return [];
}

export function resolveWeaponAttackAttributes(
  weapon: Pick<WeaponApi, "range" | "properties">,
  rules: Pick<SystemRulesConfig, "meleeAttackAttributes" | "rangedAttackAttributes">
): string[] {
  const baseAttributes = isRangedWeapon(weapon)
    ? rules.rangedAttackAttributes ?? DEFAULT_RANGED_ATTACK_ATTRIBUTES
    : rules.meleeAttackAttributes ?? DEFAULT_MELEE_ATTACK_ATTRIBUTES;

  const propertyAttributes = (weapon.properties ?? []).flatMap(resolvePropertyAttackAttributes);
  const merged = [...baseAttributes, ...propertyAttributes];

  return [...new Set(merged)];
}

export interface WeaponAttributeStats {
  attributeKeys: string[];
  attributeModifier: number;
  attributeValue: number;
}

export function resolveWeaponAttributeStats(
  weapon: Pick<WeaponApi, "range" | "properties">,
  rules: Pick<SystemRulesConfig, "meleeAttackAttributes" | "rangedAttackAttributes">,
  attributes: CharacterAttributeApi[]
): WeaponAttributeStats {
  const attributeKeys = resolveWeaponAttackAttributes(weapon, rules);

  let attributeModifier = 0;
  let attributeValue = 0;

  for (const key of attributeKeys) {
    const attr = attributes.find(a => a.key === key);
    const modifier = attr?.modifier ?? 0;
    const value = attr?.value ?? 0;

    if (modifier > attributeModifier) {
      attributeModifier = modifier;
    }
    if (value > attributeValue) {
      attributeValue = value;
    }
  }

  return { attributeKeys, attributeModifier, attributeValue };
}

export function weaponHasTwoHandedProperty(weapon?: Pick<WeaponApi, "properties">): boolean {
  return (weapon?.properties ?? []).some(property =>
    TWO_HANDED_PROPERTY_NAMES.has(normalizeLabel(property.name))
  );
}

export function weaponHasPropertyById(
  weapon: Pick<WeaponApi, "properties"> | undefined,
  propertyId: string
): boolean {
  return (weapon?.properties ?? []).some(property => property.id === propertyId);
}
