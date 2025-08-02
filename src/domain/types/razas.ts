import { AbilityBonusesApi, AbilityBonusesMongo, ChoiceApi, ChoiceMongo, DoteApi, OptionsApi, OptionsMongo } from "."
import { HabilidadApi } from "./habilidades.types"
import { IdiomaApi } from "./idiomas.types"
import { RasgoApi, RasgoDataMongo } from "./rasgos.types"

export interface RaceMongo {
  index: string,
  name: string,
  desc: string,
  img: string,
  speed: number,
  size: string,
  ability_bonuses: AbilityBonusesMongo[],
  traits: string[],
  languages: string[],
  language_choices?: ChoiceMongo,
  skill_choices?: ChoiceMongo,
  options: OptionsMongo[],
  subraces: SubraceMongo[],
  variants: VarianteMongo[]
}

export interface SubraceMongo {
  index: string,
  name: string,
  desc: string,
  img: string,
  ability_bonuses: AbilityBonusesMongo[],
  traits: string[],
  traits_data: RasgoDataMongo,
  language_choices?: ChoiceMongo,
  options: OptionsMongo[],
  types: TypeMongo[],
}

export interface TypeMongo {
  name: string,
  desc: string,
  img: string
}

export interface VarianteMongo {
  name: String,
  ability_bonuses: AbilityBonusesMongo[],
  skill_choices?: ChoiceMongo,
  options: OptionsMongo[],
  dotes?: number
}

export interface RaceApi {
  index: string,
  name: string,
  desc: string,
  img: string,
  speed: number,
  size: string,
  ability_bonuses: AbilityBonusesApi[],
  traits: RasgoApi[],
  languages: IdiomaApi[],
  language_choices?: ChoiceApi<IdiomaApi>,
  skill_choices?: ChoiceApi<HabilidadApi>,
  options: OptionsApi[],
  subraces: SubraceApi[]
} 

export interface SubraceApi {
  index: string,
  name: string,
  desc: String,
  img: string,
  ability_bonuses: AbilityBonusesApi[],
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  language_choices?: ChoiceApi<IdiomaApi>,
  options: OptionsApi[],
  /*resistances: DañoApi[],*/
  types: TypeApi[],
}

export interface TypeApi {
  name: string,
  desc: string,
  img: string
}

export interface VarianteApi {
  name: String,
  ability_bonuses: AbilityBonusesApi[],
  skill_choices?: ChoiceApi<HabilidadApi>,
  options: OptionsApi[],
  dotes: {
    choose: number,
    options: DoteApi[]
  } | null
}