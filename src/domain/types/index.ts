export interface LogearUsuarioParams {
  user: string;
  password: string;
}

export interface LogearUsuarioResult {
  token: any;
  user: {
    name: any;
  };
}

export interface RazaMongo {
  index: string,
  name: string,
  img: string,
  desc: string,
  speed: string,
  size: string,
  subraces: SubrazaMongo[]
  ability_bonuses: AbilityBonusesMongo[],
  languages: string[],
  traits: string[],
  resistances: string[]
}

export interface SubrazaMongo {
  index: string,
  name: string,
  img: string,
  desc: string,
  speed: string,
  types: razaType[],
  ability_bonuses: AbilityBonusesMongo[],
  languages: string[],
  traits: string[],
  resistances: string[]
}

export interface RazaApi {
  index: string,
  name: string,
  img: string,
  desc: string,
  speed: string,
  size: string,
  subraces: SubrazaApi[],
  ability_bonuses: AbilityBonusesApi[],
  languages: IdiomaApi[],
  traits: RasgoApi[],
  resistances: DañoApi[]
}

export interface SubrazaApi {
  index: string,
  name: string,
  img: string,
  desc: string,
  speed: string,
  types: razaType[],
  ability_bonuses: AbilityBonusesApi[],
  traits: RasgoApi[],
  resistances: DañoApi[]
}

export interface AbilityBonusesMongo {
  index: string,
  bonus: number
}

export interface AbilityBonusesApi {
  index: string,
  name: string,
  bonus: number
}

export interface razaType {
  index: string,
  name: string,
  img: string
}

export interface IdiomaApi {
  index: string,
  name: string
}

export interface RasgoMongo {
  index: string,
  name: string,
  desc: string[]
}

export interface RasgoApi {
  index: string,
  name: string,
  desc: string
}

export interface DañoApi {
  index: string,
  name: string
}