import { ObjectId } from "mongoose"

export interface SkillMongo {
  _id: ObjectId,
  ruleset: string,
  name: string,
  description?: string,
  key: string,
  bonusFormula?: string,
  attributeScore: string[],
  deletedAt?: Date
}

export interface SkillApi {
  id: string,
  ruleset: string,
  name: string,
  description?: string,
  key: string,
  bonusFormula?: string,
  attributeScore: string[],
  deletedAt?: Date
} 

export interface SkillPersonajeApi extends Omit<SkillApi, 'ruleset' | 'bonusFormula'> {
  value: number,
  modifier: number
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
