import { ObjectId } from "mongoose"
import { Damage } from "."
import { ProficiencyApi } from "./proficiencies.types"
import { SpellApi } from "./spell.types"
import { EstadoApi } from "./estados.types"
import { LanguageApi } from "./language.types"
import { EquipmentMaterial } from "./equipment.types"
import { CreatureTypeApi } from "./creatureType.types"

export const EQUIPMENT_RESTRICTION_SCOPES = ["armor", "shield"] as const;
export type EquipmentRestrictionScope = typeof EQUIPMENT_RESTRICTION_SCOPES[number];

export const EQUIPMENT_RESTRICTION_ENFORCEMENTS = ["block", "warn"] as const;
export type EquipmentRestrictionEnforcement = typeof EQUIPMENT_RESTRICTION_ENFORCEMENTS[number];

export interface EquipmentRestriction {
  forbiddenMaterials: EquipmentMaterial[];
  unlessMaterials?: EquipmentMaterial[];
  scopes: EquipmentRestrictionScope[];
  enforcement: EquipmentRestrictionEnforcement;
}

export type MovementMode = "walk" | "fly" | "climb" | "swim" | "burrow";

export interface MovementSpeeds {
  walk?: number;
  fly?: number;
  climb?: number;
  swim?: number;
  burrow?: number;
}

export type TraitSpeedCondition = "always";

export interface TraitSpeed {
  set?: MovementSpeeds;
  add?: MovementSpeeds;
  equalToWalk?: Exclude<MovementMode, "walk">[];
  condition?: TraitSpeedCondition;
}

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

export interface TraitCompanionRoster {
  count: number;
  suggestedRoles?: string[];
}

export interface TraitLanguages {
  speaks: string[];
  understands: string[];
}

export interface TraitLanguagesApi {
  speaks: LanguageApi[];
  understands: LanguageApi[];
}

export interface TraitDamageChoiceOption {
  name: string;
  damageTypeId: string;
}

export interface TraitDamageChoiceOptionApi extends TraitDamageChoiceOption {
  damage?: Damage;
}

export type TraitCatalogLanguage = "optional" | "required";

export interface TraitCatalogOption {
  name: string;
  inputs?: number;
  repeatable?: boolean;
  label?: string;
  creatureTypeId?: string;
  races?: number;
}

export interface TraitCatalogOptionApi extends TraitCatalogOption {
  creatureType?: CreatureTypeApi;
  eligibleRaces?: { id: string; name: string }[];
}

export type TraitCatalogSource = "creatureTypes";

export interface TraitCatalogCreatureTypeRaces {
  creatureTypeId: string;
  races: number;
  label: string;
}

export interface TraitCatalogCreatureTypeRacesApi extends TraitCatalogCreatureTypeRaces {
  creatureType?: CreatureTypeApi;
}

export interface TraitCatalogChoice {
  key: string;
  options: TraitCatalogOption[];
  grants: { atLevel: number; choose: number }[];
  language?: TraitCatalogLanguage;
  source?: TraitCatalogSource;
  creatureTypeRaces?: TraitCatalogCreatureTypeRaces[];
}

export interface TraitCatalogChoiceApi {
  key: string;
  options: TraitCatalogOptionApi[];
  grants: { atLevel: number; choose: number }[];
  language?: TraitCatalogLanguage;
  source?: TraitCatalogSource;
  creatureTypeRaces?: TraitCatalogCreatureTypeRacesApi[];
}

export interface CatalogChoiceEntry {
  name: string;
  inputs?: string[];
  raceIds?: string[];
  languageId?: string | null;
}

export type TraitChoiceValue = string | CatalogChoiceEntry;

export interface PendingCatalogChoice {
  traitId: string;
  key: string;
  add: number;
  options: TraitCatalogOptionApi[];
  chosen: TraitChoiceValue[];
}

export interface ResolvedCatalogChoice {
  label: string;
  language?: LanguageApi | null;
  creatureType?: CreatureTypeApi;
  races?: { id: string; name: string }[];
}

export interface TraitDamageChoice {
  key: string;
  choose: number;
  options: TraitDamageChoiceOption[];
}

export interface TraitDamageChoiceApi {
  key: string;
  choose: number;
  options: TraitDamageChoiceOptionApi[];
}

export interface TraitDamageChoiceRef {
  traitId: string;
  choiceKey: string;
  grantsResistance?: boolean;
}

export type TraitHitPointScope = "class" | "character";

export interface TraitHitPoints {
  perLevel: number;
  scope: TraitHitPointScope;
}

export interface ResolvedDamageChoice {
  name: string;
  damage: Damage;
}

export type TraitChoices = Record<string, Record<string, TraitChoiceValue[]>>;

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
  speed?: number | TraitSpeed,
  discard?: string[],
  spells?: [],
  bonuses?: {
    armor_class: number
  },
  acFormula?: string,
  suppressedByArmorTypeIds?: string[],
  ignoresArmorSpeedPenaltyForTypeIds?: string[],
  equipmentRestriction?: EquipmentRestriction,
  spellPrivileges?: SpellPrivilegeRule[],
  companionRoster?: TraitCompanionRoster,
  languages?: TraitLanguages,
  damageChoices?: TraitDamageChoice[],
  catalogChoices?: TraitCatalogChoice[],
  damageChoiceRef?: TraitDamageChoiceRef,
  hitPoints?: TraitHitPoints,
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
  speed?: TraitSpeed,
  spells?: SpellApi[]
  discard?: string[],
  bonuses?: {
    armor_class: number
  },
  acFormula?: string,
  suppressedByArmorTypeIds?: string[],
  ignoresArmorSpeedPenaltyForTypeIds?: string[],
  equipmentRestriction?: EquipmentRestriction,
  spellPrivileges?: SpellPrivilegeRule[],
  companionRoster?: TraitCompanionRoster,
  languages?: TraitLanguagesApi,
  damageChoices?: TraitDamageChoiceApi[],
  catalogChoices?: TraitCatalogChoiceApi[],
  damageChoiceRef?: TraitDamageChoiceRef,
  damageChoice?: ResolvedDamageChoice[],
  catalogChoice?: ResolvedCatalogChoice[],
  hitPoints?: TraitHitPoints
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
  resistances?: string[],
  spellPrivileges?: SpellPrivilegeRule[],
  speed?: TraitSpeed,
  acFormula?: string | null,
  suppressedByArmorTypeIds?: string[] | null,
  ignoresArmorSpeedPenaltyForTypeIds?: string[] | null,
  equipmentRestriction?: EquipmentRestriction | null,
  companionRoster?: TraitCompanionRoster,
  languages?: TraitLanguages | null,
  damageChoices?: TraitDamageChoice[] | null,
  catalogChoices?: TraitCatalogChoice[] | null,
  damageChoiceRef?: TraitDamageChoiceRef | null,
  hitPoints?: TraitHitPoints | null
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
  resistances?: string[],
  spellPrivileges?: SpellPrivilegeRule[],
  speed?: TraitSpeed,
  acFormula?: string | null,
  suppressedByArmorTypeIds?: string[] | null,
  ignoresArmorSpeedPenaltyForTypeIds?: string[] | null,
  equipmentRestriction?: EquipmentRestriction | null,
  companionRoster?: TraitCompanionRoster,
  languages?: TraitLanguages | null,
  damageChoices?: TraitDamageChoice[] | null,
  catalogChoices?: TraitCatalogChoice[] | null,
  damageChoiceRef?: TraitDamageChoiceRef | null,
  hitPoints?: TraitHitPoints | null
}
