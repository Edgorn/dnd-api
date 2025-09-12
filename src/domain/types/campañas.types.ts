import { ObjectId } from "mongoose"
import { UsuarioApi } from "./usuarios.types"
import { PersonajeBasico } from "./personajes.types"

export interface CampañaMongo {
  _id: ObjectId,
  name: string,
  description: string,
  master: string,
  status: string,
  players_requesting: string[],
  players: string[],
  characters: string[]
}

export interface CampañaBasica {
  id: string,
  name: string,
  isMember: boolean,
  isMaster: boolean,
  players: number,
  status: string,
  master: string
}

export interface CampañaApi {
  id: string,
  name: string,
  description: string,
  isMaster: boolean,
  players_requesting: UsuarioApi[],
  players: UsuarioApi[],
  characters: PersonajeBasico[],
  master: string,
  status: string,
}

export interface TypeCrearCampaña {
  name: string, 
  description: string, 
  master: string
}

export interface TypeEntradaCampaña { 
  masterId: string, 
  campaignId: string, 
  userId: string 
}

export interface TypeEntradaPersonajeCampaña {
  userId: string, 
  campaignId: string, 
  characterId: string
}