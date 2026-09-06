import { ObjectId } from "mongoose"
import { TraitApi, TraitDataMongo } from "./traits.types"
import { SkillPersonajeApi } from "./skill.types"
import { CreatureLanguages, CreatureLanguagesCreate } from "./language.types"
import { ProficiencyApi } from "./proficiencies.types"
import { Damage, Speed } from "."
import { CharacterEquipmentApi } from "./equipment.types"
import { DoteApi } from "./dotes.types"
import { SpellApi } from "./spell.types"
import { EstadoApi } from "./estados.types"
import { SpellcastingLevel } from "./characterClass.types"
import { InvocacionApi } from "./invocaciones.types"
import { CriaturaApi } from "./criaturas.types"
import { CharacterAttributeApi } from "./attribute.types"
import { Ideal } from "./background.types"
import { CoinApi } from "./coin.types"

export interface PersonajeEquipmentMongo {
  id: string;
  quantity: number;
  equipped?: boolean;
  isMagic?: boolean;
  isBond?: boolean;
  isFavorite?: boolean;
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
  equipment: Pick<PersonajeEquipmentMongo, 'id' | 'quantity'>[];
  traits: string[],
  traits_data: TraitDataMongo,
  money: {
    unit: string,
    quantity: number
  }[],
  dotes: string[],
  hit_die: number,
  prof_bonus: number
}

export interface TypeLevelUp {
  id: string;
  classId: string;
  hpIncrease: number;
  userId: string;
}

export interface TypeAddEquipment {
  quantity: number;
  equip: string;
  id: string;
  isMagic: boolean;
  isBond: boolean;
}

export interface TypeDeleteEquipment {
  quantity: number;
  equip: string;
  id: string;
  isMagic: boolean;
  isBond: boolean;
}

export interface UpdateCharacterEquipmentResponse {
  equipment: CharacterEquipmentApi[];
}

export interface TypeEquiparArmadura {
  equipped: boolean;
  equip: string;
  id: string;
  isMagic: boolean;
  isBond: boolean;
}

export interface TypeToggleFavoriteEquipment {
  id: string;
  equip: string;
  isMagic: boolean;
  isBond: boolean;
  isFavorite: boolean;
}

export interface ToggleFavoriteEquipmentResponse {
  id: string;
  equip: string;
  isMagic: boolean;
  isBond: boolean;
  isFavorite: boolean;
}

export type PersonajeMoneyItem = { quantity: number } & CoinApi;

export interface UpdateCharacterMoneyResponse {
  money: PersonajeMoneyItem[];
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
  dotes: string[],
  prof_bonus: number,
  plusSpeed: 0,
  proficiency_weapon: string[],
  proficiency_armor: string[],
  proficiencies: string[],
  equipment: PersonajeEquipmentMongo[];
  HPMax: number,
  HPActual: number,
  XP: 0,
  invocations: string[],
  forms: string[]
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
  dotes: DoteApi[],
  money: ({
    quantity: number;
  } & CoinApi)[],
  spells: Record<string, { list: SpellApi[]; type: string; }>,
  maxCarryingCapacity: number,
  spellcasting?: SpellcastingLevel[],
  invocations?: InvocacionApi[],
  forms?: CriaturaApi[]
}

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Abilities = Record<AbilityKey, number>;

export interface LevelUpData {
  class: string;
  hit_die: number;
  prof_bonus: number;
  // traits?: TraitApi[];
  // traits_data?: TraitDataMongo;
  // traits_options?: { name: string; options: TraitApi[] };
  // ability_score?: boolean;
  // dotes?: ChoiceApi<DoteApi>;
  // subclasesData?: SubclassesOptionsApi | null;
  // double_skills?: number;
  // spells?: SpellApi[];
  // spell_choices?: ChoiceApi<SpellApi>[];
  // mixed_spell_choices?: ChoiceApi<SpellApi>[][];
  // spell_changes?: ChoiceApi<SpellApi>[][];
  // skill_choices?: ChoiceApi<SkillApi>;
  // invocations_choices?: ChoiceApi<InvocacionApi>;
  // invocations_change?: ChoiceApi<InvocacionApi>;
}
