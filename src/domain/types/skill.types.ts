import type { Types } from "mongoose";

export interface SkillMongo {
  _id: Types.ObjectId;
  ruleset: string;
  name: string;
  description?: string;
  key: string;
  bonusFormula?: string;
  attributeScore: string[];
  deletedAt?: Date | null;
}

export interface SkillApi {
  id: string,
  ruleset: string,
  name: string,
  description?: string,
  key: string,
  bonusFormula?: string,
  attributeScore: string[],
  deletedAt?: Date | null
}

export type SkillApiPublic = Omit<SkillApi, 'deletedAt'>; 

export interface SkillPersonajeApi extends Omit<SkillApi, 'ruleset' | 'bonusFormula'> {
  value: number,
  modifier: number,
  passive?: number
}

export interface InputCreateSkill {
  ruleset: string,
  name: string,
  description?: string,
  key: string,
  bonusFormula?: string,
  attributeScore: string[]
}

export interface InputUpdateSkill {
  id: string,
  name?: string,
  description?: string,
  key?: string,
  bonusFormula?: string,
  attributeScore?: string[]
}
