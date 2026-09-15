import { ObjectId } from "mongoose"
import { Damage } from "."
import { ProficiencyApi } from "./proficiencies.types"
import { SpellApi } from "./spell.types"
import { EstadoApi } from "./estados.types"

export type SpellPrivilegeSource = "known" | "classList";
export type SpellPrivilegeRecharge = "shortRest" | "longRest" | "shortOrLongRest";

export interface SpellPrivilegeFilter {
  level: number | number[];
}

export interface SpellPrivilegeFreeCast {
  slotLevel: "spellLevel";
  uses: number | "unlimited";
  recharge: SpellPrivilegeRecharge | null;
}

export interface SpellPrivilegeReplace {
  hours: number;
  sameLevel: boolean;
}

export interface SpellPrivilegeRule {
  choose: number;
  source: SpellPrivilegeSource;
  filter: SpellPrivilegeFilter;
  alwaysPrepared: boolean;
  countsTowardPreparedCap: boolean;
  freeCast: SpellPrivilegeFreeCast | null;
  replace: SpellPrivilegeReplace | null;
}

export interface TraitMongo {
  _id: ObjectId,
  index: string,
  name: string,
  description?: string[],
  summary?: string[],
  ruleset: string,
  incompatible_traits?: string[],
  hidden?: boolean,
  resistances: string[],
  condition_inmunities: string[],
  conditional_resistances: string[],
  proficiencies?: string[],
  skills?: string[],
  speed?: number,
  discard?: string[],
  spells?: [],
  bonuses?: {
    armor_class: number
  },
  spellPrivileges?: SpellPrivilegeRule[],
  deletedAt?: Date | null
}

export interface TraitDataMongo {
  [key: string]: {
    [key: string]: string
  }
}

export interface TraitsOptionsMongo {
  name: string,
  options: string[]
}

export interface TraitApi {
  id: string,
  name: string,
  description: string[],
  summary: string[],
  ruleset: string,
  incompatible_traits: TraitApi[],
  hidden?: boolean,
  resistances: Damage[],
  conditional_resistances: Damage[],
  condition_inmunities: EstadoApi[],
  proficiencies: ProficiencyApi[],
  skills?: string[],
  speed?: number,
  spells?: SpellApi[]
  discard?: string[],
  bonuses?: {
    armor_class: number
  },
  spellPrivileges?: SpellPrivilegeRule[]
}

export interface TraitsOptionsApi {
  name: string,
  options: TraitApi[]
}

export interface CreateTrait {
  name: string,
  description: string[],
  summary: string[],
  ruleset: string,
  incompatible_traits: string[],
  proficiencies?: string[],
  skills?: string[],
  spellPrivileges?: SpellPrivilegeRule[]
}

export interface UpdateTrait {
  id: string,
  name?: string,
  description?: string[],
  summary?: string[],
  ruleset?: string,
  incompatible_traits?: string[],
  proficiencies?: string[],
  skills?: string[],
  spellPrivileges?: SpellPrivilegeRule[]
}
