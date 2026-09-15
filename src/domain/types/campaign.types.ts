import { ObjectId } from "mongoose"
import { UserApi } from "./user.types"
import { PersonajeBasico } from "./personajes.types"
import { SystemBasic } from "./system.types"

export interface CampaignMongo {
  _id: ObjectId,
  name: string,
  description: string,
  master: string,
  status: string,
  players_requesting: string[],
  players: string[],
  characters: string[],
  system: string,
  initialLevel: number,
  maxPlayers: number,
  language: string,
  deletedAt?: Date | null
}

export interface CampaignBasic {
  id: string,
  name: string,
  isMember: boolean,
  isMaster: boolean,
  players: number,
  status: string,
  master: string,
  system: SystemBasic,
  initialLevel: number,
  maxPlayers: number,
  language: string
}

export interface CampaignApi {
  id: string,
  name: string,
  description: string,
  isMaster: boolean,
  players_requesting: UserApi[],
  players: UserApi[],
  characters: PersonajeBasico[],
  master: string,
  status: string,
  system: SystemBasic,
  initialLevel: number,
  maxPlayers: number,
  language: string
}

export interface CreateCampaignInput {
  name: string,
  description: string,
  master: string,
  system: string,
  initialLevel: number,
  maxPlayers: number,
  language: string
}

export interface CampaignJoinInput {
  masterId: string,
  campaignId: string,
  userId: string
}

export interface AddCharacterToCampaignInput {
  userId: string,
  campaignId: string,
  characterId: string
}
