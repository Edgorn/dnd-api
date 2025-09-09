import { ObjectId } from "mongoose"
import { AbilityKey } from "./personajes.types"

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
  ability_score: AbilityKey,
  value: number
}