import { ChoiceApi, ChoiceMongo, MixedChoicesApi, MixedChoicesMongo, OptionSelectApi } from ".";
import { ProficiencyApi } from "./proficiencies.types";
import { EquipamientoChoiceApi, EquipamientoOpcionesMongo, EquipamientoPersonajeApi, EquipamientoPersonajeMongo } from "./equipamientos.types";
import { SkillApi } from "./skill.types";
import { LanguageApi } from "./language.types";
import { TraitApi, TraitsOptionsApi, TraitsOptionsMongo } from "./traits.types";

export interface InputCreateBackground {
  ruleset: string;
  name: string;
  description: string[];
  img?: string;
}

export interface InputUpdateBackground {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string[];
  img?: string;
}

export interface BackgroundMongo {
  _id?: any;
  ruleset: string;
  deletedAt?: Date | null;
  name: string;
  description: string[];
  img: string;
  traits: string[];
  traits_options?: TraitsOptionsMongo;
  skills: string[];
  language_choices?: ChoiceMongo;
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  equipment: EquipamientoPersonajeMongo[];
  equipment_choices?: EquipamientoOpcionesMongo[][];
  starting_equipment_options?: EquipamientoOpcionesMongo[][];
  personalized_equipment: string[];
  money: {
    quantity: number;
    unit: string;
  };
  options_name?: OptionsNameMongo;
  god: boolean;
  personality_traits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
  variants: VariantMongo[];
}

export interface VariantMongo {
  name: string;
  description?: string[];
  traits?: string[];
  traits_options?: TraitsOptionsMongo;
  proficiencies_choices?: ChoiceMongo[];
  mixed_choices?: MixedChoicesMongo[][];
  equipment: EquipamientoPersonajeMongo[];
  equipment_choices?: EquipamientoOpcionesMongo[][];
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
  traits_options?: TraitsOptionsApi;
  skills?: SkillApi[];
  language_choices?: ChoiceApi<LanguageApi>;
  proficiencies: ProficiencyApi[];
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  equipment?: EquipamientoPersonajeApi[];
  equipment_choices?: EquipamientoChoiceApi[][];
  personalized_equipment: string[];
  money: {
    quantity: number;
    unit: string;
  };
  options_name?: OptionsNameApi;
  god: boolean;
  personality_traits: OptionSelectApi[];
  ideals: OptionSelectApi[];
  bonds: OptionSelectApi[];
  flaws: OptionSelectApi[];
  variants: VariantApi[];
}

export interface VariantApi {
  name: string;
  description?: string[];
  traits?: TraitApi[];
  traits_options?: TraitsOptionsApi;
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  mixed_choices?: MixedChoicesApi[][];
  equipment?: EquipamientoPersonajeApi[];
  equipment_choices?: EquipamientoChoiceApi[][];
  personalized_equipment: string[];
  options_name?: OptionsNameApi;
}

export interface OptionsNameApi {
  name: string;
  options: OptionSelectApi[];
  choose: number;
}

// Aliases for legacy compatibility if needed
export type TransfondoMongo = BackgroundMongo;
export type TransfondoApi = BackgroundApi;
