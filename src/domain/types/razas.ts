import { AbilityBonusesApi, AbilityBonusesMongo, DañoApi, IdiomaApi, OptionsApi, OptionsMongo, RasgoApi } from "."

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
  subraces: SubraceMongo[]
}

export interface SubraceMongo {
  index: string,
  name: string,
  img: string,
  ability_bonuses: AbilityBonusesMongo[],
  traits: string[],
  traits_data: {
    [key: string]: {
      [key: string]: string
    }
  },
  options: OptionsMongo[],
  resistances: string[],
  types: TypeMongo[],
  desc?: string
}

export interface TypeMongo {
  name: string,
  desc: string,
  img: string
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
  img: string,
  ability_bonuses: AbilityBonusesApi[],
  traits: RasgoApi[],
  options: OptionsApi[],
  resistances: DañoApi[],
  types: TypeApi[],
  desc?: String
}

export interface TypeApi {
  name: string,
  desc: string,
  img: string
}
