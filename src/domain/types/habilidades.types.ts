import { ObjectId } from "mongoose"
import { AbilityKey } from "./personajes.types"

export interface HabilidadMongo {
  _id: ObjectId,
  index: string,
  name: string,
  ability_score: AbilityKey
}

export interface HabilidadApi {
  index: string,
  name: string,
  ability_score: AbilityKey
}

export interface HabilidadPersonajeApi extends HabilidadApi {
  value: number
}