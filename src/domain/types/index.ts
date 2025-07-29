import { ObjectId } from "mongoose";

export interface AbilityBonusesMongo {
  index: string,
  bonus: number
}

export interface AbilityBonusesApi {
  index: string,
  name: string,
  bonus: number
}

export interface IdiomaMongo {
  index: string,
  name: string,
  type: string,
  typical_speakers: string[],
  script: string
}

export interface IdiomaApi {
  index: string,
  name: string
}

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

export interface RasgoApi {
  index: string,
  name: string,
  desc: string,
  hidden?: boolean,
  resistances: DañoApi[],
  conditional_resistances: DañoApi[],
  condition_inmunities: any[],
  proficiencies_weapon: CompetenciaApi[],
  proficiencies_armor: CompetenciaApi[],
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

export interface DañoApi {
  index: string,
  name: string,
  desc: string
}

export interface ConjuroMongo {
  index: string,
  name: string,
  type: string,
  level: number,
  classes: string[],
  typeName: string,
  school: string,
  casting_time: string,
  range: string,
  components: string[],
  duration: string,
  desc: string[],
  ritual: boolean 
}

export interface ConjuroApi {
  index: string,
  name: string,
  type: string,
  level: number,
  classes: string[],
  typeName: string,
  school: string,
  casting_time: string,
  range: string,
  components: string[],
  duration: string,
  desc: string[],
  ritual: boolean
}

export interface ProficienciesMongo {
  index: string,
  type: string
}

export interface ProficienciesApi {
  index: string,
  name: string,
  type: string
}

export interface HabilidadApi {
  index: string,
  name: string,
  ability_score: string
}

export interface CompetenciaApi {
  _id: ObjectId,
  index: string,
  name: string,
  type: string,
  desc: [string]
}

export interface OptionsMongo {
  type: string,
  options: OptionsMongo[] | string[],
  api?: string,
  choose: number
}

export interface OptionsApi {
  options: ({ index: string; name: string; } | OptionsApi)[],
  choose: number,
  type: string,
  //spell?: any
}

export interface EquipamientoMongo {
  index: string,
  quantity: number
}

export interface EquipamientoApi {
  index: string,
  name: string,
  quantity: number,
  content: {
    name: string,
    quantity: number,
    item?: string
  }[],
  equipped?: boolean,
  category?: string,
  weapon?: {
    damage: {
      name: string,
      type: string
    },
    two_handed_damage: {
      name: string,
      type: string
    },
    properties: (string | any)[]
  }
  armor?: {
    category: string,
    class: {
      base: number,
      dex_bonus: number,
      max_bonus: number
    }
  },
  isMagic?: boolean,
}

export interface EquipamientoOpcionesMongo {
  items: {
    index: String,
    quantity: Number
  }[],
  api: String,
  quantity: number
}

export interface EquipamientoOpcionesApi {
  items: {
    index: String,
    quantity: Number
  }[],
  name: String
}

export interface DoteMongo {
  _id: ObjectId,
  name: string,
  desc: string[]
}

export interface DoteApi {
  index: string,
  name: string,
  desc: string
}