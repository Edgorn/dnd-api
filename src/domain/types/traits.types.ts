import { ObjectId } from "mongoose"
import { DañoApi } from "."
import { CompetenciaApi } from "./competencias.types"
import { ConjuroApi } from "./conjuros.types"
import { EstadoApi } from "./estados.types"

export interface TraitMongo {
  _id: ObjectId,
  index: string,
  name: string,
  description?: string[],
  summary?: string[],
  ruleset: string,
  incompatible_traits?: string[],
  desc?: string[],
  hidden?: boolean,
  resistances: string[],
  condition_inmunities: string[],
  conditional_resistances: string[],
  proficiencies_weapon?: string[],
  proficiencies_armor?: string[],
  proficiencies?: string[],
  skills?: string[],
  speed?: number,
  discard?: string[],
  spells?: [],
  bonuses?: {
    armor_class: number
  },
  deletedAt?: Date | null
}

export interface TraitDataMongo {
  [key: string]: {
    [key: string]: string
  }
}

export interface TraitsOptionsMongo {
  name: string,
  options: string[]
}

export interface TraitApi {
  id: string,
  name: string,
  description: string[],
  summary: string[],
  ruleset: string,
  incompatible_traits: TraitApi[],
  hidden?: boolean,
  resistances: DañoApi[],
  conditional_resistances: DañoApi[],
  condition_inmunities: EstadoApi[],
  proficiencies: CompetenciaApi[],
  skills?: string[],
  speed?: number,
  spells?: ConjuroApi[]
  discard?: string[],
  bonuses?: {
    armor_class: number
  },
  deletedAt?: Date | null
}

export interface TraitsOptionsApi {
  name: string,
  options: TraitApi[]
}

export interface CreateTrait {
  name: string,
  description: string[],
  summary: string[],
  ruleset: string,
  incompatible_traits: string[],
  skills?: string[]
}

export interface UpdateTrait {
  id: string,
  name: string,
  description: string[],
  summary: string[],
  ruleset: string,
  incompatible_traits: string[],
  skills?: string[]
}
