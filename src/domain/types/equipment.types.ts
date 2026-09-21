import { ObjectId } from "mongoose";
import { ChoiceApi } from ".";
import { CoinApi } from "./coin.types";
import { Property } from "./property.types";
import { ProficiencyApi } from "./proficiencies.types";
import { ArmorType } from "./armorType.types";

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

export interface ArmorAttributeBonus {
  key: string;
  max?: number;
}

export interface ArmorAttributeMinimum {
  key: string;
  value: number;
  unmetSpeedPenalty?: number;
}

export interface ArmorClass {
  base: number;
  attributeBonus?: ArmorAttributeBonus;
}

export interface ArmorMongo {
  typeId?: string;
  class?: ArmorClass;
  attributeMinimum?: ArmorAttributeMinimum;
  disadvantageSkillKeys?: string[];
}

export interface ArmorInput {
  typeId?: string;
  class?: ArmorClass;
  attributeMinimum?: ArmorAttributeMinimum;
  disadvantageSkillKeys?: string[];
}

export interface ArmorApi {
  type?: ArmorType | null;
  class?: ArmorClass;
  attributeMinimum?: ArmorAttributeMinimum;
  disadvantageSkillKeys?: string[];
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

/** Body / clothing equip slots (excludes weapon hand slots). */
export const BODY_EQUIP_SLOTS: readonly EquipSlot[] = [
  'head',
  'neck',
  'cloak',
  'armor',
  'hands',
  'waist',
  'feet',
  'ring'
] as const;

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

export type EquipmentCostApi = { quantity: number } & CoinApi;

export interface CharacterEquipmentMongo {
  instanceId?: string;
  equipmentId?: string;
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
  isFavorite?: boolean;
  equipped?: boolean;
  bonuses?: {
    armor_class?: number;
    saving_throws?: number;
  };
  content?: CharacterEquipmentMongo[];
}

export interface EquipmentMongo {
  _id: ObjectId;
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
  cost: EquipmentCostApi;
  weight: number;
  category: string;
  subcategory: string;
  equipSlot?: EquipSlot | null;
  storageTags?: string[];
  containerStats?: ContainerRules;
  proficiencies?: ProficiencyApi[];
  content?: EquipmentInstanceApi[];
  equipped?: boolean;
  weapon?: WeaponApi;
  armor?: ArmorApi;
  isMagic?: boolean;
  isBond?: boolean;
  bonuses?: {
    armor_class?: number;
    saving_throws?: number;
  };
  deletedAt?: Date | null;
}

export interface EquipmentInstanceApi extends EquipmentApi {
  quantity: number;
  equipped?: boolean;
  isFavorite?: boolean;
  instanceId?: string;
}

export interface CharacterEquipmentApi extends EquipmentInstanceApi {
  instanceId: string;
  isProficient: boolean;
  attackBonus?: number;
  damageBonus?: number;
}

export interface EquipmentOptionsMongo {
  choose: number;
  options: string[] | string | { id?: string; quantity: number }[];
  quantity: number;
}

/** Legacy formatted choice groups (nested equipment_choices array shape). */
export interface EquipmentChoiceApi {
  name: string;
  choose: number;
  options: EquipmentInstanceApi[];
}

export type EquipmentChoiceFilter = Record<string, string | number | (string | number)[]>;

/** Leaf of an equipment choice: concrete item or a nested flat choice (options/filter). */
export type EquipmentChoiceLeafMongo =
  | { type: "item"; id: string; quantity?: number }
  | { type: "choice"; choose: number; options?: string[]; filter?: EquipmentChoiceFilter };

/** Nested branch: leaf or AND bundle of leaves (non-recursive). */
export type EquipmentChoiceBranchMongo =
  | EquipmentChoiceLeafMongo
  | { type: "bundle"; items: EquipmentChoiceLeafMongo[] };

/**
 * Equipment choice stored on classes/backgrounds.
 * Simple mode: options XOR filter (backward compatible).
 * Nested mode: alternatives (item vs nested choice vs AND bundle, e.g. pouch vs focus, or martial+shield vs two martial).
 */
export interface EquipmentChoiceMongo {
  choose: number;
  options?: string[];
  filter?: EquipmentChoiceFilter;
  alternatives?: EquipmentChoiceBranchMongo[];
}

export type EquipmentChoiceLeafApi =
  | { type: "item"; value: EquipmentApi; quantity?: number }
  | { type: "choice"; value: ChoiceApi<EquipmentApi> };

export type EquipmentChoiceBranchApi =
  | EquipmentChoiceLeafApi
  | { type: "bundle"; items: EquipmentChoiceLeafApi[] };

/** Resolved equipment choice for API responses (discriminated by query_type). */
export type ResolvedEquipmentChoiceApi =
  | {
      choose: number;
      query_type: "options" | "filter" | "all";
      options: EquipmentApi[];
      query_filter?: EquipmentChoiceFilter;
    }
  | {
      choose: number;
      query_type: "mixed";
      options: EquipmentChoiceBranchApi[];
    };

export interface EquipmentBasic {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  equipSlot?: EquipSlot | null;
  weapon?: WeaponBasic;
  armor?: ArmorBasic;
}

export interface WeaponBasic {
  category?: string;
  range?: string;
}

export interface ArmorBasic {
  typeId?: string;
  typeName?: string;
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
  armor?: ArmorInput | null;
  content?: CharacterEquipmentMongo[];
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
  armor?: ArmorInput | null;
  content?: CharacterEquipmentMongo[];
}
