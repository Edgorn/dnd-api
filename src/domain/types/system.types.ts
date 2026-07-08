import { ObjectId } from "mongoose";
import { AttributeApi } from "./attribute.types";
import { SkillApi } from "./skill.types";

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
  deletedAt?: Date;
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
  languagesCount: number;
  traitsCount: number;
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
  attributes: AttributeApi[];
  skills: SkillApi[];
  deletedAt?: Date;
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
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
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
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
  maxLevel?: number;
  maxSpellLevel?: number;
}
