import { ObjectId } from "mongoose";
import { AttributeApi } from "./attribute.types";

export interface System {
  _id: ObjectId;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  maxAttributeValue?: number;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
}

export interface SystemApi {
  id: string;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
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
  attributes: AttributeApi[];
}

export interface TypeCrearSystem {
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
}

export interface TypeModificarSystem {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  isOpen?: boolean;
  globalModifierFormula?: string;
  initiativeBonusFormula?: string;
  defaultMinAttributeValue?: number;
  defaultMaxAttributeValue?: number;
  creationMinAttributeValue?: number;
  creationMaxAttributeValue?: number;
}
