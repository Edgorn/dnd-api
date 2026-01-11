import { ObjectId } from "mongoose"
import { RasgoApi, RasgoDataMongo } from "./rasgos.types"
import { HabilidadPersonajeApi } from "./habilidades.types"
import { IdiomaApi } from "./idiomas.types"
import { CompetenciaApi } from "./competencias.types"
import { ChoiceApi, DañoApi } from "."
import { EquipamientoPersonajeApi } from "./equipamientos.types"
import { DoteApi } from "./dotes.types"
import { ConjuroApi } from "./conjuros.types"
import { EstadoApi } from "./estados.types"
import { ClaseLevelUp, SpellcastingLevel } from "./clases.types"
import { InvocacionApi } from "./invocaciones.types"

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

export interface TypeAñadirEquipamiento {
  cantidad: number, equip: string, id: string, isMagic: boolean, isBond: boolean
}

export interface TypeEliminarEquipamiento {
  cantidad: number, equip: string, id: string, isMagic: boolean, isBond: boolean
}

export interface TypeEquiparArmadura {
  nuevoEstado: boolean,
  equip: string,
  id: string,
  isMagic: boolean
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
  }[],
  CA: number,
  HPMax: number,
  HPActual: number,
  XP: number,
  XPMax: number,
  abilities: {
    str: number,
    dex: number,
    con: number,
    int: number,
    wis: number,
    cha: number
  },
  speed: number,
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
    history: string[],
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
  spells: Record<string, string[]>,
  skills: string[],
  double_skills: string[],
  classes: { class: string, name: string, level: number, hit_die: number }[],
  saving_throws: string[],
  subclasses: string[],
  traits: string[],
  traits_data: RasgoDataMongo,
  money: {
    pc: number;   // piezas de cobre
    pp: number;   // piezas de plata
    pe: number;   // piezas de electrum
    po: number;   // piezas de oro
    ppt: number;  // piezas de platino
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
    isMagic: boolean,
    isBond?: boolean
  }[],
  HPMax: number,
  HPActual: number,
  XP: 0,
  invocations: string[]
}

export interface PersonajeApi {
  id: string,
  img: string,
  name: string,
  race: string,
  classes: {
    class: string,
    level: number,
    name: string,
    hit_die: number
  }[],
  subclasses: string[],
  campaign: {
    index: string,
    name: string | null | undefined
  } | null,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  background: {
    name: string,
    type: {
      name: string,
      values: string[]
    },
    history: string[],
    alignment: string,
    personality: string[],
    ideals: string[],
    bonds: string[],
    flaws: string[],
    god: string,
  },
  level: number,
  XP: number,
  XPMax: number,
  abilities: Abilities,
  HPMax: number,
  CA: number,
  speed: number,
  skills: HabilidadPersonajeApi[],
  languages: IdiomaApi[],
  proficiencies: CompetenciaApi[],
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  resistances: DañoApi[],
  conditional_resistances: { name: string, resistances: DañoApi[] }[],
  condition_inmunities: { name: string, estados: EstadoApi[] }[]
  prof_bonus: number,
  saving_throws: string[],
  equipment: EquipamientoPersonajeApi[],
  dotes: DoteApi[],
  money: {
    pc: number;   // piezas de cobre
    pp: number;   // piezas de plata
    pe: number;   // piezas de electrum
    po: number;   // piezas de oro
    ppt: number;  // piezas de platino
  },
  spells: Record<string, { list: ConjuroApi[]; type: string; }>,
  cargaMaxima: number,
  spellcasting?: SpellcastingLevel[],
  invocations?: InvocacionApi[]
}

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Abilities = Record<AbilityKey, number>;

export interface ClaseLevelUpCharacter extends ClaseLevelUp {
  clase: string,
  prof_bonus: number
}

export interface TypeSubirNivel {
  id: string,
  hit: number,
  clase: string,
  traits: string[],
  traits_data: RasgoDataMongo,
  prof_bonus: number,
  subclase?: string,
  abilities: Record<AbilityKey, number> | null,
  dotes: string[],
  skills: string[],
  double_skills: string[],
  proficiencies: string[],
  spells: string[],
  invocations: string[],
}