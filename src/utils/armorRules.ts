import { Speed } from "../domain/types";
import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { evaluateFormula } from "./formulaEvaluator";

export interface ArmorRulesClass {
  base: number;
  attributeBonus?: { key: string; max?: number };
}

export interface ArmorRulesType {
  id?: string;
}

export interface ArmorRulesBlock {
  class?: ArmorRulesClass;
  attributeMinimum?: {
    key: string;
    value: number;
    unmetSpeedPenalty?: number;
  };
  disadvantageSkillKeys?: string[];
  type?: ArmorRulesType | null;
}

export interface ArmorRulesEquipment {
  equipped?: boolean;
  equipSlot?: string | null;
  isMagic?: boolean;
  isProficient?: boolean;
  bonuses?: { armor_class?: number };
  armor?: ArmorRulesBlock;
}

export interface ArmorRulesTrait {
  id: string;
  acFormula?: string;
  suppressedByArmorTypeIds?: string[];
  ignoresArmorSpeedPenaltyForTypeIds?: string[];
  bonuses?: { armor_class?: number };
}

function attributeModifier(attributes: CharacterAttributeApi[], key: string): number {
  const attr = attributes.find(item => item.key === key);
  if (!attr) return 0;
  if (typeof attr.modifier === "number") return attr.modifier;
  return Math.floor((attr.value / 2) - 5);
}

function attributeValue(attributes: CharacterAttributeApi[], key: string): number {
  return attributes.find(item => item.key === key)?.value ?? 10;
}

function hasArmorClass(item: ArmorRulesEquipment): boolean {
  return typeof item.armor?.class?.base === "number";
}

export function isBodyArmorPiece(item: ArmorRulesEquipment): boolean {
  return hasArmorClass(item) && item.equipSlot === "armor";
}

export function isStackingArmorPiece(item: ArmorRulesEquipment): boolean {
  return hasArmorClass(item) && Boolean(item.equipSlot) && item.equipSlot !== "armor";
}

export function equippedArmorPieces(equipment: ArmorRulesEquipment[]): ArmorRulesEquipment[] {
  return equipment.filter(item => item.equipped && item.armor);
}

export function findBodyArmor(equipment: ArmorRulesEquipment[]): ArmorRulesEquipment | undefined {
  return equippedArmorPieces(equipment).find(isBodyArmorPiece);
}

export function findStackingArmor(equipment: ArmorRulesEquipment[]): ArmorRulesEquipment[] {
  return equippedArmorPieces(equipment).filter(isStackingArmorPiece);
}

export function collectEquippedArmorTypeIds(equipment: ArmorRulesEquipment[]): string[] {
  return [...new Set(
    equippedArmorPieces(equipment)
      .map(item => item.armor?.type?.id)
      .filter((id): id is string => Boolean(id))
  )];
}

export interface ArmorSuppressionContext {
  typeIds: string[];
}

export function collectEquippedArmorSuppression(equipment: ArmorRulesEquipment[]): ArmorSuppressionContext {
  return {
    typeIds: collectEquippedArmorTypeIds(equipment)
  };
}

export function isTraitSuppressedByArmor(
  trait: ArmorRulesTrait,
  equipped: ArmorSuppressionContext
): boolean {
  const requiredTypeIds = trait.suppressedByArmorTypeIds ?? [];
  if (requiredTypeIds.length === 0) return false;
  return requiredTypeIds.some(id => equipped.typeIds.includes(id));
}

export function applyAttributeBonus(modifier: number, max?: number): number {
  if (max === undefined) return modifier;
  return Math.min(modifier, max);
}

function pieceAc(item: ArmorRulesEquipment, attributes: CharacterAttributeApi[], replaceBody: boolean): number {
  const armorClass = item.armor?.class;
  if (!armorClass) return 0;

  const magicBonus = item.isMagic ? 1 : 0;
  if (!replaceBody) {
    return (armorClass.base ?? 0) + magicBonus;
  }

  const bonus = armorClass.attributeBonus;
  const attributePart = bonus
    ? applyAttributeBonus(attributeModifier(attributes, bonus.key), bonus.max)
    : 0;

  return armorClass.base + attributePart + magicBonus;
}

export function computeArmorPieceAc(
  item: ArmorRulesEquipment,
  attributes: CharacterAttributeApi[]
): number {
  return pieceAc(item, attributes, true);
}

export interface ComputeArmorClassInput {
  equipment: ArmorRulesEquipment[];
  traits: ArmorRulesTrait[];
  attributes: CharacterAttributeApi[];
  baseUnarmoredAc: number;
}

export function computeArmorClass(input: ComputeArmorClassInput): number {
  const { equipment, traits, attributes, baseUnarmoredAc } = input;
  const equipped = equippedArmorPieces(equipment);
  const body = findBodyArmor(equipped);
  const stacking = findStackingArmor(equipped);
  const equippedArmor = collectEquippedArmorSuppression(equipped);
  const activeTraits = traits.filter(trait => !isTraitSuppressedByArmor(trait, equippedArmor));

  let ca = baseUnarmoredAc;

  if (body) {
    ca = pieceAc(body, attributes, true);
  } else {
    const formulaCandidates = activeTraits
      .filter(trait => trait.acFormula)
      .map(trait => evaluateFormula(trait.acFormula as string, attributes));
    ca = Math.max(baseUnarmoredAc, ...formulaCandidates);
  }

  for (const item of stacking) {
    ca += pieceAc(item, attributes, false);
  }

  for (const item of equipment.filter(piece => piece.equipped)) {
    if (item.armor?.class) continue;
    ca += item.bonuses?.armor_class ?? 0;
  }

  for (const trait of activeTraits) {
    ca += trait.bonuses?.armor_class ?? 0;
  }

  return ca;
}

export function applyArmorStrengthSpeedPenalty(
  speed: Speed,
  bodyArmor: ArmorRulesEquipment | undefined,
  attributes: CharacterAttributeApi[],
  traits: ArmorRulesTrait[] = []
): Speed {
  const minimum = bodyArmor?.armor?.attributeMinimum;
  const penalty = minimum?.unmetSpeedPenalty;
  if (!minimum || penalty === undefined || penalty <= 0) {
    return speed;
  }
  if (attributeValue(attributes, minimum.key) >= minimum.value) {
    return speed;
  }

  const armorTypeId = bodyArmor?.armor?.type?.id;
  if (
    armorTypeId &&
    traits.some(trait => (trait.ignoresArmorSpeedPenaltyForTypeIds ?? []).includes(armorTypeId))
  ) {
    return speed;
  }

  return {
    ...speed,
    walk: Math.max(0, (speed.walk ?? 0) - penalty)
  };
}

export function collectStealthDisadvantageSkillKeys(equipment: ArmorRulesEquipment[]): string[] {
  const keys = new Set<string>();
  for (const item of equippedArmorPieces(equipment)) {
    for (const skillKey of item.armor?.disadvantageSkillKeys ?? []) {
      keys.add(skillKey);
    }
  }
  return [...keys];
}

export function isWearingArmorWithoutProficiency(equipment: ArmorRulesEquipment[]): boolean {
  return equippedArmorPieces(equipment).some(item => item.armor && item.isProficient === false);
}
