import { ChoiceApi, ChoiceMongo, EquipamientoOpcionesApi } from "."
import { CompetenciaApi } from "./competencias.types"
import { EquipamientoChoiceApi, EquipamientoOpcionesMongo, EquipamientoPersonajeApi, EquipamientoPersonajeMongo } from "./equipamientos.types"
import { HabilidadApi } from "./habilidades.types"
import { RasgoApi, RasgoDataMongo } from "./rasgos.types"

export interface ClaseMongo {
  index: string,
  name: string,
  desc: string
  img: string,
  hit_die: number,
  proficiencies: string[],
  skill_choices?: ChoiceMongo,
  saving_throws: string[],
  equipment: EquipamientoPersonajeMongo[],
  equipment_choices?: EquipamientoOpcionesMongo[][],
  levels: ClaseLevelMongo[]
}

export interface ClaseLevelMongo {
  level: number,
  proficiencies: string[]
  traits: string[],
  traits_data: RasgoDataMongo,
  subclasses_options: SubclasesOptionsMongo,
  subclasses: SubclasesMongo,
  ability_score: boolean
}

export interface SubclasesOptionsMongo {
  name: String,
  desc: string,
  options: SubclasesOptionsMongoOption[]
}

export interface SubclasesOptionsMongoOption {
  index: string,
  name: string,
  img: string
}

export interface SubclasesMongo {
  [key: string]: SubclaseMongo
}

export interface SubclaseMongo {
  traits: string[],
  traits_options?: {
    name: string,
    options: string[]
  }
}

export interface ClaseApi {
  index: string,
  name: string,
  desc: string
  img: string,
  hit_die: number,
  proficiencies: CompetenciaApi[],
  skill_choices?: ChoiceApi<HabilidadApi>,
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  saving_throws: {
    index: string,
    name: string
  }[],
  equipment?: EquipamientoPersonajeApi[],
  equipment_choices?: EquipamientoChoiceApi[][],
  prof_bonus: number
}

export interface SubclasesOptionsApi {
  name: String,
  desc: string,
  options: SubclaseOptionApi[]
}

export interface SubclaseOptionApi {
  index: string,
  name: string,
  img: string,
  traits: RasgoApi[],
  traits_options?: {
    name: string,
    options: RasgoApi[]
  }
}

export interface SubclaseApi {
  traits: RasgoApi[],
  traits_options?: {
    name: string,
    options: RasgoApi[]
  }
}

export interface ClaseLevelUp {
  hit_die: number,
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  traits_options?: {
    name: string,
    options: RasgoApi[]
  },
  ability_score: boolean,
  subclasesData: SubclasesOptionsApi | null
}