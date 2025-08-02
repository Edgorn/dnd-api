import { ObjectId } from "mongoose"

export interface HabilidadMongo {
  _id: ObjectId,
  index: string,
  name: string,
  ability_score: string
}

export interface HabilidadApi {
  index: string,
  name: string,
  ability_score: string
}

export interface HabilidadPersonajeApi {
  index: string,
  name: string,
  ability_score: string,
  value: number
}