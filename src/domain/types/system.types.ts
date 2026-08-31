import { ObjectId } from "mongoose";
import { AttributeApi } from "./attribute.types";
import { SkillApi } from "./skill.types";
import { CoinApi } from "./coin.types";

export interface System {
  _id: ObjectId;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  parentId?: ObjectId;
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
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
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
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
}

export interface SystemApi {
  id: string;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  parentId?: string;
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
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
  attributes: AttributeApi[];
  skills: SkillApi[];
  coins: CoinApi[];
}

export interface TypeCrearSystem {
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  isBase: boolean;
  parentId?: string;
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
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
}

export interface TypeModificarSystem {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  isOpen?: boolean;
  isBase?: boolean;
  parentId?: string;
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
  hpInitialFormula?: string;
  hpLevelUpFormula?: string;
  baseAcFormula?: string;
  passiveSkillFormula?: string;
  carryingCapacityFormula?: string;
}
