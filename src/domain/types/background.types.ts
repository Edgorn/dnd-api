import { ChoiceApi, ChoiceMongo, MixedChoicesApi, MixedChoicesMongo } from ".";
import { ProficiencyApi } from "./proficiencies.types";
import { EquipmentApi, CharacterEquipmentMongo, CharacterEquipmentApi, EquipmentOptionsMongo } from "./equipment.types";
import { SkillApi } from "./skill.types";
import { LanguageApi } from "./language.types";
import { TraitApi, TraitDataMongo } from "./traits.types";
import { CoinApi } from "./coin.types";

export interface Ideal {
  title: string;
  description: string;
  alignment: string;
}

export interface InputCreateBackground {
  ruleset: string;
  name: string;
  description: string[];
  img?: string;
  god?: boolean;
  traits?: string[] | null;
  traits_data?: TraitDataMongo | null;
  skills?: string[] | null;
  language_choices?: ChoiceMongo | null;
  personality_traits?: string[] | null;
  ideals?: Ideal[] | null;
  bonds?: string[] | null;
  flaws?: string[] | null;
  money?: {
    quantity: number;
    unit: string;
  }[] | null;
  equipment_choices?: ChoiceMongo[] | null;
  equipment?: CharacterEquipmentMongo[] | null;
}

export interface InputUpdateBackground {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string[];
  img?: string;
  god?: boolean;
  traits?: string[] | null;
  traits_data?: TraitDataMongo | null;
  skills?: string[] | null;
  language_choices?: ChoiceMongo | null;
  personality_traits?: string[] | null;
  ideals?: Ideal[] | null;
  bonds?: string[] | null;
  flaws?: string[] | null;
  money?: {
    quantity: number;
    unit: string;
  }[] | null;
  equipment_choices?: ChoiceMongo[] | null;
  equipment?: CharacterEquipmentMongo[] | null;
}

export interface BackgroundMongo {
  _id?: any;
  ruleset: string;
  deletedAt?: Date | null;
  name: string;
  description: string[];
  img: string;
  traits: string[];
  traits_data?: TraitDataMongo;
  skills: string[];
  language_choices?: ChoiceMongo;
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  equipment: CharacterEquipmentMongo[];
  equipment_choices?: ChoiceMongo[];
  starting_equipment_options?: EquipmentOptionsMongo[][];
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
  variants: VariantMongo[];
}

export interface VariantMongo {
  name: string;
  description?: string[];
  traits?: string[];
  traits_data?: TraitDataMongo;
  proficiencies_choices?: ChoiceMongo[];
  mixed_choices?: MixedChoicesMongo[][];
  equipment: CharacterEquipmentMongo[];
  equipment_choices?: ChoiceMongo[];
  personalized_equipment: string[];
  options_name?: OptionsNameMongo;
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
  name: string;
  description: string[];
  img: string;
  traits: TraitApi[];
  traits_data?: TraitDataMongo;
  skills?: SkillApi[];
  language_choices?: ChoiceApi<LanguageApi>;
  proficiencies: ProficiencyApi[];
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  equipment?: CharacterEquipmentApi[];
  equipment_choices?: ChoiceApi<EquipmentApi>[];
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
  variants: VariantApi[];
}

export interface VariantApi {
  name: string;
  description?: string[];
  traits?: TraitApi[];
  traits_data?: TraitDataMongo;
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  mixed_choices?: MixedChoicesApi[][];
  equipment?: CharacterEquipmentApi[];
  equipment_choices?: ChoiceApi<EquipmentApi>[];
  personalized_equipment: string[];
  options_name?: OptionsNameApi;
}

export interface OptionsNameApi {
  name: string;
  options: string[];
  choose: number;
}
