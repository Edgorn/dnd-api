import { ObjectId } from "mongoose";
import { Property } from "./property.types";
import { ProficiencyApi } from "./proficiencies.types";

export interface WeaponDamageMongo {
  dice: string;
  type: string;
}

export interface WeaponDamageApi {
  dice: string;
  name: string;
  desc: string;
}

export interface WeaponMongo {
  category?: string;
  damage?: WeaponDamageMongo[];
  two_handed_damage?: WeaponDamageMongo[];
  properties?: string[];
  range?: string;
  range_throw?: {
    normal: number;
    long: number;
  };
}

export interface WeaponApi {
  category?: string;
  damage: WeaponDamageApi[];
  two_handed_damage: WeaponDamageApi[];
  properties: Property[];
  range?: string;
  range_throw?: {
    normal: number;
    long: number;
  };
}

export interface ArmorMongo {
  category?: string;
  class?: {
    base: number;
    dex_bonus: number;
    max_bonus: number;
  };
  str_minimum?: number;
  stealth_disadvantage?: number;
}

export type LiquidUnit = 'gallon' | 'pint' | 'ounce';
export type SolidUnit = 'cubic_foot';

export type EquipSlot =
  | 'head'
  | 'neck'
  | 'cloak'
  | 'armor'
  | 'hands'
  | 'waist'
  | 'feet'
  | 'ring'
  | 'main_hand'
  | 'off_hand'
  | 'two_handed';

export interface LiquidVolumeDef {
  value: number;
  unit: LiquidUnit;
}

export interface SolidVolumeDef {
  value: number;
  unit: SolidUnit;
}

export interface ContainerRules {
  maxWeight?: number;
  maxItems?: number;
  acceptedStorageTags?: string[];
  maxLiquidCapacity?: LiquidVolumeDef;
  maxSolidCapacity?: SolidVolumeDef;
}

export interface EquipmentCost {
  quantity: number;
  unit: string;
}

export interface CharacterEquipmentMongo {
  id?: string;
  quantity?: number;
  name?: string;
  description?: string | string[];
  cost?: EquipmentCost;
  weight?: number;
  category?: string;
  subcategory?: string;
  equipSlot?: EquipSlot | null;
  storageTags?: string[] | null;
  containerStats?: ContainerRules | null;
  proficiencies?: string[];
  weapon?: WeaponMongo;
  armor?: ArmorMongo;
  isMagic?: boolean;
  isBond?: boolean;
  equipped?: boolean;
  bonuses?: {
    armor_class?: number;
    saving_throws?: number;
  };
  content?: CharacterEquipmentMongo[];
}

export interface EquipmentMongo {
  _id?: ObjectId | string;
  id?: string;
  ruleset?: string;
  name: string;
  description?: string | string[];
  content?: CharacterEquipmentMongo[];
  cost?: EquipmentCost;
  equipped?: boolean;
  equipSlot?: EquipSlot | null;
  category?: string;
  subcategory?: string;
  storageTags?: string[] | null;
  containerStats?: ContainerRules | null;
  proficiencies?: string[];
  weapon?: WeaponMongo;
  armor?: ArmorMongo;
  weight?: number;
  isMagic?: boolean;
  bonuses?: {
    armor_class?: number;
    saving_throws?: number;
  };
  deletedAt?: Date | null;
}

export interface EquipmentApi {
  id: string;
  ruleset: string;
  name: string;
  description: string;
  cost: EquipmentCost;
  weight: number;
  category: string;
  subcategory: string;
  equipSlot?: EquipSlot | null;
  storageTags?: string[];
  containerStats?: ContainerRules;
  proficiencies?: ProficiencyApi[];
  content?: CharacterEquipmentApi[];
  equipped?: boolean;
  weapon?: WeaponApi;
  armor?: ArmorMongo;
  isMagic?: boolean;
  isBond?: boolean;
  bonuses?: {
    armor_class?: number;
    saving_throws?: number;
  };
  deletedAt?: Date | null;
}

export interface CharacterEquipmentApi extends EquipmentApi {
  quantity: number;
  equipped?: boolean;
  attackBonus?: number;
  damageBonus?: number;
}

export interface EquipmentOptionsMongo {
  choose: number;
  options: string[] | string | { id?: string; quantity: number }[];
  quantity: number;
}

export interface EquipmentChoiceApi {
  name: string;
  choose: number;
  options: CharacterEquipmentApi[];
}

export interface EquipmentBasic {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  weapon?: WeaponBasic;
  armor?: ArmorBasic;
}

export interface WeaponBasic {
  category?: string;
  range?: string;
}

export interface ArmorBasic {
  category?: string;
}

export interface InputCreateEquipment {
  ruleset: string;
  name: string;
  description: string;
  cost: EquipmentCost;
  weight: number;
  category: string;
  subcategory: string;
  equipSlot?: EquipSlot | null;
  storageTags?: string[] | null;
  containerStats?: ContainerRules | null;
  proficiencies?: string[] | null;
  weapon?: WeaponMongo | null;
}

export interface InputUpdateEquipment {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string;
  cost?: EquipmentCost;
  weight?: number;
  category?: string;
  subcategory?: string;
  equipSlot?: EquipSlot | null;
  storageTags?: string[] | null;
  containerStats?: ContainerRules | null;
  proficiencies?: string[] | null;
  weapon?: WeaponMongo | null;
}
