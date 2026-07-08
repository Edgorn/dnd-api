import { ObjectId } from "mongoose"

export interface InputCreateLanguage {
  name: string,
  description?: string,
  type?: string,
  script?: string,
  ruleset: string,
  deletedAt?: Date
}

export interface InputUpdateLanguage {
  id: string,
  name?: string,
  description?: string,
  type?: string,
  script?: string,
  ruleset: string
}

export interface LanguageMongo {
  _id: ObjectId,
  index?: string,
  name: string,
  type?: string,
  description?: string,
  script?: string,
  ruleset: string,
  deletedAt?: Date
}

export interface LanguageApi {
  id: string,
  name: string,
  type?: string,
  description?: string,
  script?: string,
  ruleset: string,
  deletedAt?: Date
}

export interface CreatureLanguagesCreate {
  understands: string[],
  speaks: string[],
  notes?: string
}

export interface CreatureLanguages {
  understands: LanguageApi[],
  speaks: LanguageApi[],
  notes?: string
}
