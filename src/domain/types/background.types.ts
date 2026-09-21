import { ChoiceApi, ChoiceMongo } from ".";
import { ProficiencyApi } from "./proficiencies.types";
import { CharacterEquipmentMongo, EquipmentInstanceApi, EquipmentChoiceMongo, ResolvedEquipmentChoiceApi } from "./equipment.types";
import { SkillApi } from "./skill.types";
import { LanguageApi } from "./language.types";
import { TraitApi, TraitDataMongo } from "./traits.types";
import { CoinApi } from "./coin.types";

export type BackgroundOverlayField =
  | "name"
  | "description"
  | "img"
  | "god"
  | "traits"
  | "traits_choices"
  | "traits_data"
  | "skills"
  | "language_choices"
  | "proficiencies"
  | "proficiencies_choices"
  | "personality_traits"
  | "ideals"
  | "bonds"
  | "flaws"
  | "money"
  | "equipment"
  | "equipment_choices";

export interface Ideal {
  title: string;
  description: string;
  alignment: string;
}

export interface InputCreateBackground {
  ruleset: string;
  name: string;
  description?: string[];
  img?: string;
  god?: boolean;
  parentId?: string | null;
  traits?: string[] | null;
  traits_choices?: ChoiceMongo[] | null;
  traits_data?: TraitDataMongo | null;
  skills?: string[] | null;
  language_choices?: ChoiceMongo | null;
  proficiencies?: string[] | null;
  proficiencies_choices?: ChoiceMongo[] | null;
  personality_traits?: string[] | null;
  ideals?: Ideal[] | null;
  bonds?: string[] | null;
  flaws?: string[] | null;
  money?: {
    quantity: number;
    unit: string;
  }[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
  equipment?: CharacterEquipmentMongo[] | null;
}

export interface InputUpdateBackground {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string[];
  img?: string;
  god?: boolean;
  parentId?: string | null;
  traits?: string[] | null;
  traits_choices?: ChoiceMongo[] | null;
  traits_data?: TraitDataMongo | null;
  skills?: string[] | null;
  language_choices?: ChoiceMongo | null;
  proficiencies?: string[] | null;
  proficiencies_choices?: ChoiceMongo[] | null;
  personality_traits?: string[] | null;
  ideals?: Ideal[] | null;
  bonds?: string[] | null;
  flaws?: string[] | null;
  money?: {
    quantity: number;
    unit: string;
  }[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
  equipment?: CharacterEquipmentMongo[] | null;
}

export interface BackgroundMongo {
  _id?: any;
  ruleset: string;
  deletedAt?: Date | null;
  parentId?: any | null;
  name: string;
  description: string[];
  img: string;
  traits: string[];
  traits_choices?: ChoiceMongo[];
  traits_data?: TraitDataMongo;
  skills: string[];
  language_choices?: ChoiceMongo;
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  equipment: CharacterEquipmentMongo[];
  equipment_choices?: EquipmentChoiceMongo[];
  personalized_equipment: string[];
  money: {
    quantity: number;
    unit: string;
  }[];
  options_name?: OptionsNameMongo;
  god: boolean;
  personality_traits: string[];
  ideals: Ideal[];
  bonds: string[];
  flaws: string[];
}

export interface OptionsNameMongo {
  name: string;
  options: string[];
  choose: number;
}

export interface BackgroundApi {
  id: string;
  ruleset: string;
  deletedAt?: Date | null;
  parentId?: string | null;
  name: string;
  description: string[];
  img: string;
  traits: TraitApi[];
  traits_choices?: ChoiceApi<TraitApi>[];
  traits_data?: TraitDataMongo;
  skills?: SkillApi[];
  language_choices?: ChoiceApi<LanguageApi>;
  proficiencies: ProficiencyApi[];
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  equipment?: EquipmentInstanceApi[];
  equipment_choices?: ResolvedEquipmentChoiceApi[];
  personalized_equipment: string[];
  money: ({
    quantity: number;
  } & CoinApi)[];
  options_name?: OptionsNameApi;
  god: boolean;
  personality_traits: string[];
  ideals: Ideal[];
  bonds: string[];
  flaws: string[];
  variants: BackgroundApi[];
  overriddenFields?: BackgroundOverlayField[];
}

export interface OptionsNameApi {
  name: string;
  options: string[];
  choose: number;
}
