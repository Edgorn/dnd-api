import { ObjectId } from "mongoose"

export interface CrearIdioma {
  id?: string,
  name: string,
  description: string,
  type: string,
  script: string,
  ruleset: string
}

export interface IdiomaMongo {
  _id: ObjectId,
  index?: string,
  name: string,
  type: string,
  description: string,
  script: string,
  ruleset: string
}

export interface IdiomaApi {
  id: string,
  name: string,
  type: string,
  description: string,
  script: string,
  ruleset: string
}

export interface IdiomasCriaturaCrear {
  understands: string[],
  speaks: string[],
  notes?: string
}

export interface IdiomasCriatura {
  understands: IdiomaApi[],
  speaks: IdiomaApi[],
  notes?: string
}