import { DañoApi } from "."
import { CompetenciaApi } from "./competencias.types"
import { ConjuroApi } from "./conjuros.types"
import { EstadoApi } from "./estados.types"

export interface RasgoMongo {
  index: string,
  name: string,
  desc: string[],
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
  /*type?: string,
  languages?: string[],
  */
  /*proficiencies?: string[],*//*
  tables?: {
    title: string,
    data: {
      titles: string[],
      rows: string[][]
    }
  }[]*/
}

export interface RasgoDataMongo {
  [key: string]: {
    [key: string]: string
  }
}

export interface TraitsOptionsMongo {
  name: string,
  options: string[]
}

export interface RasgoApi {
  index: string,
  name: string,
  desc: string,
  hidden?: boolean,
  resistances: DañoApi[],
  conditional_resistances: DañoApi[],
  condition_inmunities: EstadoApi[],
  proficiencies: CompetenciaApi[],
  skills?: string[],
  speed?: number,
  spells?: ConjuroApi[]
  discard?: string[],
  /*languages?: any[],
  tables?: {
    title: string,
    data: {
      titles: string[],
      rows: string[][]
    }
  }[]*/
}

export interface TraitsOptionsApi {
  name: string,
  options: RasgoApi[]
}