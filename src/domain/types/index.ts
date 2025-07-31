import { ObjectId } from "mongoose";

export interface ChoiceMongo {
  choose: number;
  options: string[] | string;
}

export interface ChoiceApi<T> {
  choose: number;
  options: T[];
}

export interface OptionSelectApi {
  label: string,
  value: string
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