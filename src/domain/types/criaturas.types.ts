import { DañoApi } from "."
import { ConjuroApi } from "./conjuros.types"
import { EstadoApi } from "./estados.types"
import { LanguageApi } from "./language.types"

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
    burrow?: number,
    notes?: string
  },
  abilities: {},
  saving: string, 
  skills: string,
  senses: {
    passive_perception: number,
    darkvision: number,
    blindsight: number,
    tremorsense?: number,
    notes?: string
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
  actions_aditional: [],
  actions_legendary: [],
  reactions: [],
  spell_slots: { [key: string]: string[] }
}
   
export interface LanguagesCriaturaMongo {
  understands: string[],
  speaks: string[],
  notes?: string
}

export interface CriaturaApi {
  id: string,
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
  actions_aditional: [],
  actions_legendary: [],
  reactions: [],
  spell_slots: { [key: string]: ConjuroApi[] }
}

export interface LanguagesCriaturaApi {
  understands: LanguageApi[],
  speaks: LanguageApi[],
  notes?: string
}