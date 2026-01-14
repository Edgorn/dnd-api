import { PropiedadesArma } from "."

export interface EquipamientoMongo {
  index: string,
  name: string,
  description: string[],
  content: EquipamientoPersonajeMongo[],
  cost: {
    quantity: number,
    unit: string
  },
  equipped?: boolean,
  category?: string,
  weapon?: WeaponMongo,
  armor?: ArmorMongo,
  weight: number,
  isMagic?: boolean,
}

export interface EquipamientoPersonajeMongo {
  index: string,
  quantity: number,
  name?: string,
  description?: string[],
  isMagic?: boolean,
  isBond?: boolean,
  equipped?: boolean,
  cost?: {
    quantity: number,
    unit: string
  }
}

export interface EquipamientoApi {
  index: string,
  name: string,
  description: string[],
  content?: EquipamientoPersonajeApi[],
  equipped?: boolean,
  category?: string,
  weapon?: WeaponApi,
  armor?: ArmorMongo,
  weight: number,
  isMagic?: boolean,
  isBond?: boolean,
  cost?: {
    quantity: number,
    unit: string
  }
}

export interface WeaponMongo {
  category: string,
  damage: WeaponDamageMongo[],
  two_handed_damage: WeaponDamageMongo[],
  properties: string[],
  range: string,
  range_throw: {
    normal: number,
    long: number
  },
  competency: string[]
}

export interface WeaponDamageMongo {
  dice: string,
  type: string
}

export interface ArmorMongo {
  category: string,
  class: {
    base: number,
    dex_bonus: number,
    max_bonus: number
  },
  str_minimum?: number,
  stealth_disadvantage?: number
}

export interface WeaponApi {
  damage: WeaponDamageApi[],
  two_handed_damage: WeaponDamageApi[],
  properties: PropiedadesArma[],
  range: string,
  range_throw: {
    normal: number,
    long: number
  },
  competency: string[]
}

export interface WeaponDamageApi {
  dice: string,
  name: string,
  desc: string
}

export interface EquipamientoPersonajeApi extends EquipamientoApi {
  quantity: number,
  equipped?: boolean
}

export interface EquipamientoOpcionesMongo {
  choose: number,
  options: string[] | string | { index: string, quantity: number }[],
  quantity: number
}

export interface EquipamientoChoiceApi {
  name: string,
  choose: number,
  options: EquipamientoPersonajeApi[],
}

export interface EquipamientoBasico {
  index: string,
  name: string,
  weapon?: WeaponBasico,
  armor?: ArmorBasico,
  category?: string,
}

export interface WeaponBasico {
  category: string,
  range: string
}

export interface ArmorBasico {
  category: string,
}