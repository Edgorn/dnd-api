import { ObjectId } from "mongoose"
import { PendingCatalogChoice, PendingDamageChoice, SpellPrivilegeRule, TraitApi, TraitChoices, TraitDataMongo } from "./traits.types"
import { LevelSkillProficiencyValue, SpellChoiceApi } from "./classLevelChoices.types"

export interface CharacterSkillProficiencyOverlay {
  skillId: string;
  value: number;
}
import { SkillApi, SkillPersonajeApi } from "./skill.types"
import { CreatureLanguages, CreatureLanguagesCreate } from "./language.types"
import { ProficiencyApi } from "./proficiencies.types"
import { ChoiceApi, Damage, Speed } from "."
import { CharacterEquipmentApi, CharacterEquipmentMongo } from "./equipment.types"
import { FeatApi, FeatRequirements } from "./feat.types"
import { SpellApi } from "./spell.types"
import { ConditionApi } from "./condition.types"
import { SpellcastingLevel, SubclassChoiceMenuApi } from "./characterClass.types"
import {
  CharacterOptionSelection,
  CharacterOptionSelectionApi,
  LevelUpOptionPick,
  PendingOptionChoice
} from "./optionGroup.types"
import { CharacterFormApi, CharacterFormMongo, CreatureFormPurpose } from "./creatureForm.types"
import { CharacterAttributeApi, AttributeApi } from "./attribute.types"
import { Ideal } from "./background.types"
import { CoinApi } from "./coin.types"

export type PersonajeEquipmentCustomization = Omit<
  CharacterEquipmentMongo,
  | "instanceId"
  | "equipmentId"
  | "id"
  | "quantity"
  | "equipped"
  | "isFavorite"
  | "isBond"
  | "isMagic"
  | "content"
>;

export interface PersonajeEquipmentMongo {
  instanceId: string;
  equipmentId: string;
  quantity: number;
  equipped: boolean;
  isMagic: boolean;
  isBond: boolean;
  isFavorite: boolean;
  customization?: PersonajeEquipmentCustomization;
}

export type CharacterStartingEquipmentInput = CharacterEquipmentMongo;

export interface CharacterTraitResource {
  traitId: string;
  spent: number;
}

export interface ConsultarPersonajeOptions {
  applyActiveTraits?: boolean;
}

export interface CharacterCompanion {
  id: string;
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
}

export interface CharacterCompanionInput {
  id?: string;
  name: string;
  role?: string;
  notes?: string;
  sourceTraitId?: string;
}

export interface UpdateCharacterCompanionsResponse {
  companions: CharacterCompanion[];
}

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
    ideals: Ideal[],
    bonds: string[],
    flaws: string[],
    god: string
  },
  img: string,
  speed: Speed,
  size: string,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  attributes: {
    key: string,
    value: number
  }[],
  systems: string[],
  race: string,
  raceId: string,
  campaign: string | null,
  languages: CreatureLanguagesCreate,
  spells: {},
  skills: string[],
  claseId: string,
  clase: string,
  saving_throws: string[],
  proficiencies: string[],
  subclase: string,
  equipment: PersonajeEquipmentMongo[];
  traits: string[],
  traits_data: TraitDataMongo,
  traitChoices?: TraitChoices,
  skillProficiencyPicks?: string[],
  money: {
    unit: string,
    quantity: number
  }[],
  feats: string[],
  hit_die: number,
  prof_bonus: number,
  companions?: CharacterCompanionInput[]
}

export interface TypePrepareSpells {
  id: string;
  classId: string;
  spells: string[];
  userId: string;
}

export interface TypeLearnSpells {
  id: string;
  classId: string;
  spells: string[];
  userId: string;
}

export interface TypeBindSpellPrivileges {
  id: string;
  traitId: string;
  classId: string;
  selections: string[][];
  userId: string;
}

export const CHARACTER_REST_TYPES = ["shortRest", "longRest"] as const;
export type CharacterRestType = typeof CHARACTER_REST_TYPES[number];

export interface TypeUseTrait {
  id: string;
  traitId: string;
  userId: string;
}

export interface TypeRestCharacter {
  id: string;
  type: CharacterRestType;
  userId: string;
  traitChoices?: TraitChoices;
}

export interface CharacterSpellPrivilegeMongo {
  traitId: string;
  classId: string;
  selections: string[][];
}

export interface CharacterSpellPrivilegeApi {
  traitId: string;
  classId: string;
  rules: SpellPrivilegeRule[];
  selections: SpellApi[][];
}

export interface AbilityScoreIncreaseInput {
  key: string;
  bonus: 1 | 2;
}

export interface TypeLevelUp {
  id: string;
  classId: string;
  hpIncrease: number;
  userId: string;
  spells?: string[][];
  subclass?: string;
  abilityScore?: { increases: AbilityScoreIncreaseInput[] };
  feat?: string;
  traitChoices?: TraitChoices;
  skillPicks?: string[];
  skillProficiencyPicks?: string[];
  proficiencyPicks?: string[][];
  spellReplacements?: { from: string; to: string }[];
  optionPicks?: LevelUpOptionPick[];
}

export interface TypeAddEquipment {
  id: string;
  equipmentId: string;
  quantity: number;
  isMagic: boolean;
}

export interface TypeDeleteEquipment {
  id: string;
  instanceId: string;
  quantity?: number;
}

export interface UpdateCharacterEquipmentResponse {
  equipment: CharacterEquipmentApi[];
}

export interface TypeEquipEquipment {
  id: string;
  instanceId: string;
  equipped: boolean;
}

export interface TypeToggleFavoriteEquipment {
  id: string;
  instanceId: string;
  isFavorite: boolean;
}

export interface ToggleFavoriteEquipmentResponse {
  id: string;
  instanceId: string;
  isFavorite: boolean;
}

export interface TypeBindPactEquipment {
  id: string;
  instanceId: string;
  isBond: boolean;
}

export type PersonajeMoneyItem = { quantity: number } & CoinApi;

export interface UpdateCharacterMoneyResponse {
  money: PersonajeMoneyItem[];
}

export interface CharacterCampaignLink {
  id: string
  userId: string
  campaign: string | null
}

export interface CharacterSubclassApi {
  class: string
  name: string
  id: string
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
  subclasses: CharacterSubclassApi[],
  CA: number,
  HPMax: number,
  HPActual: number,
  XP: number,
  XPMax: number,
  attributes: {
    key: string,
    value: number
  }[],
  systems: string[],
  speed: Speed,
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
    ideals: Ideal[],
    bonds: string[],
    flaws: string[],
    god: string
  },
  img: string,
  speed: Speed,
  size: string,
  appearance: {
    age: number,
    height: number,
    weight: number,
    eyes: string,
    hair: string,
    skin: string
  },
  attributes: {
    key: string,
    value: number
  }[],
  systems: string[],
  race: string,
  raceId: string,
  campaign: string | null,
  languages: CreatureLanguagesCreate,
  spells: Record<string, string[]>,
  skills: string[],
  classes: { class: string, name: string, level: number, hit_die: number }[],
  saving_throws: string[],
  subclasses: string[],
  traits: string[],
  traits_data: TraitDataMongo,
  traitChoices?: TraitChoices,
  skillProficiencyOverlays?: CharacterSkillProficiencyOverlay[],
  extraSpells?: Record<string, string[]>,
  money: {
    quantity: number;
    unit: string;
  }[],
  feats?: string[],
  dotes?: string[],
  prof_bonus: number,
  proficiency_weapon: string[],
  proficiency_armor: string[],
  proficiencies: string[],
  equipment: PersonajeEquipmentMongo[];
  HPMax: number,
  HPActual: number,
  XP: 0,
  optionSelections?: CharacterOptionSelection[],
  forms: CharacterFormMongo[],
  activeFormId?: string | null,
  preparedSpells?: Record<string, string[]>,
  spellPrivileges?: CharacterSpellPrivilegeMongo[],
  companions?: CharacterCompanion[],
  traitResources?: CharacterTraitResource[],
  activeTraitIds?: string[]
}

export interface PersonajeApi {
  id: string,
  img: string,
  name: string,
  race: string,
  size: string,
  classes: {
    class: string,
    level: number,
    name: string,
    hit_die: number
  }[],
  subclasses: CharacterSubclassApi[],
  campaign: {
    id: string,
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
    ideals: Ideal[],
    bonds: string[],
    flaws: string[],
    god: string,
  },
  level: number,
  XP: number,
  XPMax: number,
  attributes: CharacterAttributeApi[],
  systems: string[],
  initiativeBonus: number,
  HPMax: number,
  HPActual: number,
  CA: number,
  speed: Speed,
  skills: SkillPersonajeApi[],
  languages: CreatureLanguages,
  proficiencies: ProficiencyApi[],
  traits: TraitApi[],
  traits_data: TraitDataMongo,
  resistances: Damage[],
  conditional_resistances: { name: string, resistances: Damage[] }[],
  condition_inmunities: { name: string, estados: ConditionApi[] }[],
  conditionalConditionImmunities: { name: string, estados: ConditionApi[] }[],
  prof_bonus: number,
  saving_throws: string[],
  equipment: CharacterEquipmentApi[],
  wearingArmorWithoutProficiency: boolean,
  feats: FeatApi[],
  money: ({
    quantity: number;
  } & CoinApi)[],
  spells: Record<string, { list: SpellApi[]; extra?: SpellApi[]; prepared?: SpellApi[]; type?: AttributeApi }>,
  maxCarryingCapacity: number,
  spellcasting?: SpellcastingLevel[],
  optionSelections?: CharacterOptionSelectionApi[],
  forms?: CharacterFormApi[],
  activeFormId?: string | null,
  spellPrivileges?: CharacterSpellPrivilegeApi[],
  companions: CharacterCompanion[],
  traitResources: CharacterTraitResource[],
  activeTraitIds: string[]
}

export interface TypeAddCharacterForm {
  id: string;
  userId: string;
  creatureId: string;
  spellId: string;
}

export interface TypeSetCharacterFormActive {
  id: string;
  formId: string;
  userId: string;
}

export interface TypeAddCharacterFormPersist {
  id: string;
  userId: string;
  entry: {
    creatureId: string;
    spellId: string;
    purpose: CreatureFormPurpose;
  };
  choose: number;
  replaceOnRecast: boolean;
}

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Abilities = Record<AbilityKey, number>;

export interface LevelUpDipData {
  requirements?: FeatRequirements;
  requirementsMet: boolean;
  proficiencies: ProficiencyApi[];
  skill_choices?: ChoiceApi<SkillApi>;
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
}

export interface LevelUpSpellChanges {
  choose: number;
  from: SpellApi[];
  to: ChoiceApi<SpellApi>;
}

export interface PendingSkillProficiencyChoice {
  add: number;
  value: LevelSkillProficiencyValue;
  options: SkillApi[];
}

export interface LevelUpData {
  class: string;
  hit_die: number;
  prof_bonus: number;
  traits?: TraitApi[];
  traits_data?: TraitDataMongo;
  spell_choices?: SpellChoiceApi[];
  spell_changes?: LevelUpSpellChanges;
  subclassChoice?: SubclassChoiceMenuApi | null;
  ability_score: boolean;
  feats?: ChoiceApi<FeatApi>;
  catalogChoices?: PendingCatalogChoice[];
  damageChoices?: PendingDamageChoice[];
  skillProficiencyChoices?: PendingSkillProficiencyChoice[];
  skill_choices?: ChoiceApi<SkillApi>;
  newClass: boolean;
  requirementsMet?: boolean;
  dip?: LevelUpDipData;
  optionChoices?: PendingOptionChoice[];
}
