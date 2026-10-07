import { ObjectId } from "mongoose";

export const SYSTEM_KINDS = ["ruleset", "setting", "campaign"] as const;
export type SystemKind = (typeof SYSTEM_KINDS)[number];
export const SYSTEM_MAX_PARENTS = 16;

export const SYSTEM_RULE_FIELD_KEYS = [
  "globalModifierFormula",
  "initiativeBonusFormula",
  "maxAttributeValue",
  "defaultMinAttributeValue",
  "defaultMaxAttributeValue",
  "creationMinAttributeValue",
  "creationMaxAttributeValue",
  "maxLevel",
  "maxSpellLevel",
  "xpProgression",
  "proficiencyProgression",
  "abilityScoreProgression",
  "hpInitialFormula",
  "hpLevelUpFormula",
  "baseAcFormula",
  "passiveSkillFormula",
  "carryingCapacityFormula",
  "attackBonusFormula",
  "damageBonusFormula",
  "meleeAttackAttributes",
  "rangedAttackAttributes",
] as const;

export function resolveSystemKind(kind: string | null | undefined): SystemKind {
  if (kind === "setting" || kind === "campaign") return kind;
  return "ruleset";
}

export function isRulesetSystem(system: { kind?: string | null }): boolean {
  return resolveSystemKind(system.kind) === "ruleset";
}

export interface System {
  _id: ObjectId;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  kind?: SystemKind;
  parentIds?: ObjectId[];
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  maxAttributeValue?: number;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
  xpProgression?: number[];
  proficiencyProgression?: number[];
  abilityScoreProgression?: number[];
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
  deletedAt?: Date;
}

export interface SystemRulesConfig {
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
  xpProgression?: number[];
  proficiencyProgression?: number[];
  abilityScoreProgression?: number[];
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
}

export interface SystemApi {
  id: string;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  kind: SystemKind;
  parentIds: string[];
  canEdit: boolean;
  racesCount: number;
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  maxAttributeValue?: number;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
  xpProgression?: number[];
  proficiencyProgression?: number[];
  abilityScoreProgression?: number[];
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
}

export type SystemBasic = Pick<SystemApi, "id" | "name" | "description">;

export interface SystemSummary {
  id: string;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  kind: SystemKind;
  parentIds: string[];
  canEdit: boolean;
  racesCount: number;
  deletedAt: Date | null;
}

export interface TypeCrearSystem {
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  kind?: SystemKind;
  parentIds?: string[];
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  maxAttributeValue?: number;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
  xpProgression?: number[];
  proficiencyProgression?: number[];
  abilityScoreProgression?: number[];
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
}

export interface TypeModificarSystem {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  isOpen?: boolean;
  isBase?: boolean;
  kind?: SystemKind;
  parentIds?: string[];
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  maxAttributeValue?: number;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
  xpProgression?: number[];
  proficiencyProgression?: number[];
  abilityScoreProgression?: number[];
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
}
