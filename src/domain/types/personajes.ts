import { ObjectId } from "mongoose"
import { AbilityBonusesApi } from "."
import { RasgoDataMongo } from "./rasgos.types"

export interface TypeCrearPersonaje {
  name: string,
  user: string,
  background: {
    name: string,
    type: {
      name: string,
      values: string[]
    },
    history: string,
    alignment: string,
    personality: string[],
    ideals: string[],
    bonds: string[],
    flaws: string[],
    god: string
  },
  img: string,
  speed: number,
  size: string,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  abilities: {
    str: number,
    dex: number,
    con: number,
    int: number,
    wis: number,
    cha: number
  },
  race: string,
  raceId: string,
  subraceId: string,
  type: string,
  campaign: string | null,
  languages: string[],
  spells: {},
  skills: string[],
  double_skills: string[],
  claseId: string,
  clase: string,
  saving_throws: string[],
  proficiencies: string[],
  subclase: string,
  equipment: {
    index: string,
    quantity: number
  }[],
  traits: string[],
  traits_data: RasgoDataMongo,
  money: {
    unit: string,
    quantity: number
  },
  dotes: string[],
  hit_die: number,
  prof_bonus: number
}

export interface TypeSubirNivel {
  id: string,
  data: { 
    hit: number, 
    clase: string, 
    traits: string[],
    traits_data: RasgoDataMongo,
    prof_bonus: number,
    subclaseId: string,
    subclase: string,
    abilities: {}
  }
}

export interface PersonajeBasico {
  id: string,
  img: string,
  name: string,
  race: string,
  user: string,
  campaign: string | null,
  classes: {
    name: string,
    level: number
  } [],
  CA: number,
  HPMax: number,
  HPActual: number,
  XP: number,
  XPMax: number
}

export interface PersonajeMongo {
  _id: ObjectId,
  name: string,
  user: string,
  background: {
    name: string,
    type: {
      name: string,
      values: string[]
    },
    history: string,
    alignment: string,
    personality: string[],
    ideals: string[],
    bonds: string[],
    flaws: string[],
    god: string
  },
  img: string,
  speed: number,
  size: string,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  abilities: {
    str: number,
    dex: number,
    con: number,
    int: number,
    wis: number,
    cha: number
  },
  race: string,
  raceId: string,
  subraceId: string,
  type: string,
  campaign: string | null,
  languages: string[],
  spells: {},
  skills: string[],
  double_skills: string[],
  classes: { class: string, name: string, level: number, hit_die: number }[],
  saving_throws: string[],
  subclasses: string[],
  traits: string[],
  traits_data: RasgoDataMongo[],
  money: {
    unit: string,
    quantity: number
  },
  dotes: string[],
  prof_bonus: number,
  plusSpeed: 0,
  proficiency_weapon: string[],
  proficiency_armor: string[],
  proficiencies: string[],
  equipment: {
    index: string,
    quantity: number,
    equipped: boolean,
    isMagic: boolean
  }[],
  HPMax: number,
  HPActual: number,
  XP: 0 
}

export interface PersonajeApi {

}