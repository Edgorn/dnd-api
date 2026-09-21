import { ObjectId } from "mongoose"
import { SpellPrivilegeRule, TraitApi, TraitDataMongo } from "./traits.types"
import { SkillPersonajeApi } from "./skill.types"
import { CreatureLanguages, CreatureLanguagesCreate } from "./language.types"
import { ProficiencyApi } from "./proficiencies.types"
import { ChoiceApi, Damage, Speed } from "."
import { CharacterEquipmentApi } from "./equipment.types"
import { FeatApi } from "./feat.types"
import { SpellApi } from "./spell.types"
import { EstadoApi } from "./estados.types"
import { SpellcastingLevel, SubclassChoiceMenuApi } from "./characterClass.types"
import { InvocacionApi } from "./invocaciones.types"
import { CriaturaApi } from "./criaturas.types"
import { CharacterAttributeApi, AttributeApi } from "./attribute.types"
import { Ideal } from "./background.types"
import { CoinApi } from "./coin.types"

export interface PersonajeEquipmentMongo {
  instanceId: string;
  equipmentId: string;
  quantity: number;
  equipped: boolean;
  isMagic: boolean;
  isBond: boolean;
  isFavorite: boolean;
}

export interface CharacterStartingEquipmentInput {
  id: string;
  quantity: number;
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
  double_skills: string[],
  claseId: string,
  clase: string,
  saving_throws: string[],
  proficiencies: string[],
  subclase: string,
  equipment: PersonajeEquipmentMongo[];
  traits: string[],
  traits_data: TraitDataMongo,
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
  double_skills: string[],
  classes: { class: string, name: string, level: number, hit_die: number }[],
  saving_throws: string[],
  subclasses: string[],
  traits: string[],
  traits_data: TraitDataMongo,
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
  invocations: string[],
  forms: string[],
  preparedSpells?: Record<string, string[]>,
  spellPrivileges?: CharacterSpellPrivilegeMongo[],
  companions?: CharacterCompanion[]
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
  CA: number,
  speed: Speed,
  skills: SkillPersonajeApi[],
  languages: CreatureLanguages,
  proficiencies: ProficiencyApi[],
  traits: TraitApi[],
  traits_data: TraitDataMongo,
  resistances: Damage[],
  conditional_resistances: { name: string, resistances: Damage[] }[],
  condition_inmunities: { name: string, estados: EstadoApi[] }[],
  prof_bonus: number,
  saving_throws: string[],
  equipment: CharacterEquipmentApi[],
  wearingArmorWithoutProficiency: boolean,
  feats: FeatApi[],
  money: ({
    quantity: number;
  } & CoinApi)[],
  spells: Record<string, { list: SpellApi[]; prepared?: SpellApi[]; type?: AttributeApi }>,
  maxCarryingCapacity: number,
  spellcasting?: SpellcastingLevel[],
  invocations?: InvocacionApi[],
  forms?: CriaturaApi[],
  spellPrivileges?: CharacterSpellPrivilegeApi[],
  companions: CharacterCompanion[]
}

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Abilities = Record<AbilityKey, number>;

export interface LevelUpData {
  class: string;
  hit_die: number;
  prof_bonus: number;
  traits?: TraitApi[];
  traits_data?: TraitDataMongo;
  spell_choices?: ChoiceApi<SpellApi>[];
  subclassChoice?: SubclassChoiceMenuApi | null;
  ability_score: boolean;
  feats?: ChoiceApi<FeatApi>;
}
