import { System, SystemRulesConfig } from "../domain/types/system.types";

const SCALAR_RULE_KEYS: (keyof SystemRulesConfig)[] = [
  "globalModifierFormula",
  "initiativeBonusFormula",
  "defaultMinAttributeValue",
  "defaultMaxAttributeValue",
  "creationMinAttributeValue",
  "creationMaxAttributeValue",
  "maxLevel",
  "maxSpellLevel",
  "hpInitialFormula",
  "hpLevelUpFormula",
  "baseAcFormula",
  "passiveSkillFormula",
  "carryingCapacityFormula",
  "attackBonusFormula",
  "damageBonusFormula",
];

const ARRAY_RULE_KEYS: (keyof SystemRulesConfig)[] = [
  "xpProgression",
  "proficiencyProgression",
  "meleeAttackAttributes",
  "rangedAttackAttributes",
];

export function mergeRulesFromAncestry(ancestry: System[]): SystemRulesConfig {
  const config: SystemRulesConfig = {};

  for (const ancestor of ancestry) {
    for (const key of SCALAR_RULE_KEYS) {
      if (config[key] !== undefined) continue;
      const val = ancestor[key as keyof System];
      if (val !== undefined && val !== null && val !== "") {
        (config as Record<string, unknown>)[key] = val;
      }
    }

    for (const key of ARRAY_RULE_KEYS) {
      if (config[key] !== undefined) continue;
      const val = ancestor[key as keyof System];
      if (Array.isArray(val) && val.length > 0) {
        (config as Record<string, unknown>)[key] = val;
      }
    }
  }

  return config;
}

export const DEFAULT_XP_PROGRESSION = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

export const DEFAULT_PROFICIENCY_PROGRESSION = [
  2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6,
];

export const DEFAULT_MELEE_ATTACK_ATTRIBUTES = ["str"];
export const DEFAULT_RANGED_ATTACK_ATTRIBUTES = ["dex"];
