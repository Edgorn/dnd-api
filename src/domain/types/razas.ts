import { AbilityBonusesApi, AbilityBonusesMongo, DoteApi, OptionsApi, OptionsMongo } from "."
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
  languages: string[],
  traits: string[],
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
  languages: IdiomaApi[],
  traits: RasgoApi[],
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
  options: OptionsApi[],
  traits_data: RasgoDataMongo,
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
  options: OptionsApi[],
  dotes: {
    choose: number,
    options: DoteApi[]
  } | null
}