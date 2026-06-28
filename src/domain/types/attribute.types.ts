import { ObjectId } from "mongoose";

export interface AttributeMongo {
  _id: ObjectId;
  ruleset: string[];
  name: string;
  description: string;
  key: string;
  abbreviation: string;
  icon?: string;
}

export interface AttributeApi {
  id: string;
  ruleset: string[];
  name: string;
  description: string;
  key: string;
  abbreviation: string;
  icon?: string;
}

export interface InputCreateAttribute {
  ruleset: string;
  name: string;
  description: string;
  key: string;
  abbreviation: string;
  icon?: string;
}

export interface InputUpdateAttribute {
  id: string;
  name?: string;
  description?: string;
  key?: string;
  abbreviation?: string;
  icon?: string;
}

export interface AttributeBonusCreate {
  key: string;
  bonus: number;
}

export interface AttributeBonus {
  key: string;
  name: string;
  bonus: number;
  icon?: string;
}

export interface CharacterAttributeApi extends Omit<AttributeApi, 'ruleset'> {
  value: number,
  modifier?: number
}