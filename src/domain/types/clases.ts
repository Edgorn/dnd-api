import { EquipamientoApi, EquipamientoMongo, EquipamientoOpcionesApi, EquipamientoOpcionesMongo, OptionsApi, OptionsMongo, ProficienciesApi, ProficienciesMongo } from "."
import { RasgoApi, RasgoDataMongo } from "./rasgos.types"

export interface ClaseMongo {
  index: string,
  name: string,
  desc: string
  img: string,
  hit_die: number,
  starting_proficiencies: ProficienciesMongo[],
  saving_throws: string[],
  options: OptionsMongo[],
  starting_equipment: EquipamientoMongo[]
  starting_equipment_options: EquipamientoOpcionesMongo[][],
  levels: ClaseLevelMongo[]
}

export interface ClaseLevelMongo {
  level: number
  traits: string[],
  traits_data: RasgoDataMongo,
  prof_bonus: number,
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
  proficiencies: ProficienciesApi[],
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  saving_throws: {
    index: string,
    name: string
  }[],
  options: OptionsApi[],
  equipment: EquipamientoApi[],
  equipment_options: EquipamientoOpcionesApi[][],
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
  prof_bonus: number,
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  traits_options?: {
    name: string,
    options: RasgoApi[]
  },
  ability_score: boolean,
  subclasesData: SubclasesOptionsApi | null
}