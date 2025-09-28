import { ChoiceApi, ChoiceMongo, EquipamientoOpcionesApi } from "."
import { CompetenciaApi } from "./competencias.types"
import { ChoiceSpell, ConjuroApi } from "./conjuros.types"
import { DoteApi } from "./dotes.types"
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
  proficiencies_choices?: ChoiceMongo[],
  skill_choices?: ChoiceMongo,
  saving_throws: string[],
  equipment: EquipamientoPersonajeMongo[],
  equipment_choices?: EquipamientoOpcionesMongo[][],
  levels: ClaseLevelMongo[],
  spellcasting: string
}

export interface ClaseLevelMongo {
  level: number,
  proficiencies: string[]
  traits: string[],
  traits_data: RasgoDataMongo,
  spell_choices?: ChoiceSpell[],
  subclasses_options: SubclasesOptionsMongo,
  subclasses: SubclasesMongo,
  ability_score: boolean,
  spellcasting?: Spellcasting
}

export interface Spellcasting {
  [key: string]: number | undefined;
}

export interface SpellcastingLevel {
  class: string,
  ability: string,
  spellcasting?: Spellcasting
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
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  skill_choices?: ChoiceApi<HabilidadApi>,
  spell_choices?: ChoiceApi<ConjuroApi>[],
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
  dotes: ChoiceApi<DoteApi> | undefined,
  subclasesData: SubclasesOptionsApi | null
}