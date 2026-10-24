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
  "abilityScoreAlternativeGroupId",
  "hpInitialFormula",
  "hpLevelUpFormula",
  "baseAcFormula",
  "passiveSkillFormula",
  "carryingCapacityFormula",
  "attackBonusFormula",
  "damageBonusFormula",
  "meleeAttackAttributes",
  "rangedAttackAttributes",
  "restRules",
] as const;

export const REST_DURATION_UNITS = ["minute", "hour"] as const;
export type RestDurationUnit = (typeof REST_DURATION_UNITS)[number];

export interface SystemRestDuration {
  value: number;
  unit: RestDurationUnit;
}

export interface SystemRestKind {
  key: string;
  name: string;
  duration?: SystemRestDuration;
  includes?: string[];
}

export const HIT_POINT_HP_MODES = ["none", "full"] as const;
export type HitPointHpMode = (typeof HIT_POINT_HP_MODES)[number];
export const HIT_POINT_HIT_DICE_MODES = ["none", "all", "half"] as const;
export type HitPointHitDiceMode = (typeof HIT_POINT_HIT_DICE_MODES)[number];

export interface SystemHitPointRecovery {
  restKey: string;
  hp: HitPointHpMode;
  hitDice: HitPointHitDiceMode;
}

export const SPELL_SLOT_POOLS = ["standard", "fixedLevel"] as const;
export type SpellSlotPool = (typeof SPELL_SLOT_POOLS)[number];

export interface SystemSpellSlotRecovery {
  restKey: string;
  pools: SpellSlotPool[];
}

export interface SystemHitDiceSpending {
  on: string[];
  bonusFormula?: string;
}

export interface SystemRestRules {
  kinds: SystemRestKind[];
  endStancesOn?: string[];
  hitPointRecovery?: SystemHitPointRecovery[];
  spellSlotRecovery?: SystemSpellSlotRecovery[];
  hitDiceSpending?: SystemHitDiceSpending;
}

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
  abilityScoreAlternativeGroupId?: string;
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
  restRules?: SystemRestRules;
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
  abilityScoreAlternativeGroupId?: string;
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
  restRules?: SystemRestRules;
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
  abilityScoreAlternativeGroupId?: string;
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
  restRules?: SystemRestRules;
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
  abilityScoreAlternativeGroupId?: string;
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
  restRules?: SystemRestRules;
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
  abilityScoreAlternativeGroupId?: string | null;
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attackBonusFormula?: string;
  damageBonusFormula?: string;
  meleeAttackAttributes?: string[];
  rangedAttackAttributes?: string[];
  restRules?: SystemRestRules;
}
