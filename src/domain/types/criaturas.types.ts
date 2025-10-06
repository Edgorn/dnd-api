import { DañoApi } from "."
import { EstadoApi } from "./estados.types"
import { IdiomaApi } from "./idiomas.types"

export interface CriaturaMongo {
  index: string,
  name: string,
  type: string,
  subtype: string,
  alignment: string,
  size: string,
  armor_class: {
    type: string,
    value: number
  },
  hit_points: number,
  hit_dice: string,
  speed: {
    walk?: number,
    fly?: number,
    climb?: number,
    swim?: number,
    notes?: string
  },
  abilities: {},
  saving: string, 
  skills: string,
  senses: {
    passive_perception: number,
    darkvision: number,
    blindsight: number
  },
  languages: LanguagesCriaturaMongo,
  challenge_rating: string,
  xp: number,
  damage_vulnerabilities: [],
  damage_immunities: [],
  damage_resistances: [],
  condition_immunities: [],
  special_abilities: [],
  actions: [],
  reactions: [] 
}

export interface LanguagesCriaturaMongo {
  understands: string[],
  speaks: string[]
}

export interface CriaturaApi {
  index: string,
  name: string,
  type: string,
  subtype: string,
  alignment: string,
  size: string,
  armor_class: {
    type: string,
    value: number
  },
  hit_points: number,
  hit_dice: string,
  speed: {},
  abilities: {},
  saving: string,
  skills: string,
  senses: {},
  languages: LanguagesCriaturaApi,
  challenge_rating: string,
  xp: number,
  damage_vulnerabilities: DañoApi[],
  damage_immunities: DañoApi[],
  damage_resistances: DañoApi[],
  condition_immunities: EstadoApi[],
  special_abilities: [],
  actions: [],
  reactions: [] 
}

export interface LanguagesCriaturaApi {
  understands: IdiomaApi[],
  speaks: IdiomaApi[]
}