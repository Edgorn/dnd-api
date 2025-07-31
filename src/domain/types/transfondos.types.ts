import { ChoiceApi, ChoiceMongo, EquipamientoApi, EquipamientoMongo, EquipamientoOpcionesApi, EquipamientoOpcionesMongo, OptionsApi, OptionSelectApi, OptionsMongo, ProficienciesApi, ProficienciesMongo } from ".";
import { IdiomaApi } from "./idiomas.types";
import { RasgoApi, TraitsOptionsApi, TraitsOptionsMongo } from "./rasgos.types";

export interface TransfondoMongo {
  index: string;
  name: string;
  desc: string[];
  img: string;
  traits: string[];
  starting_proficiencies: ProficienciesMongo[],
  language_choices?: ChoiceMongo,
  options: OptionsMongo[];
  starting_equipment: EquipamientoMongo[];
  starting_equipment_options: EquipamientoOpcionesMongo[][];
  personalized_equipment: string[],
  money: {
    quantity: number,
    unit: string
  },
  options_name?: OptionsNameMongo,
  traits_options?: TraitsOptionsMongo,
  god: boolean,
  personality_traits: string[],
  ideals: string[],
  bonds: string[],
  flaws: string[],
  variants: VarianteMongo[]
}

export interface VarianteMongo {
  name: string,
  desc: string[],
  traits?: string[],
  options?: OptionsMongo[],
  starting_equipment: EquipamientoMongo[],
  starting_equipment_options?: EquipamientoOpcionesMongo[][],
  personalized_equipment: string[],
  options_name?: OptionsNameMongo,
  traits_options?: TraitsOptionsMongo
}

export interface OptionsNameMongo {
  name: string,
  options: string[],
  choose: number
}

export interface TransfondoApi {
  index: string,
  name: string,
  desc: string[],
  img: string,
  traits: RasgoApi[],
  proficiencies: ProficienciesApi[],
  language_choices?: ChoiceApi<IdiomaApi>,
  options: OptionsApi[];
  equipment: EquipamientoApi[];
  equipment_options: EquipamientoOpcionesApi[][];
  personalized_equipment: string[],
  money: {
    quantity: number,
    unit: string
  },
  options_name?: OptionsNameApi,
  traits_options?: TraitsOptionsApi,
  god: boolean,
  personality_traits: OptionSelectApi[],
  ideals: OptionSelectApi[],
  bonds: OptionSelectApi[],
  flaws: OptionSelectApi[],
  variants: VarianteApi[]
}

export interface VarianteApi {
  name: string,
  desc?: string[],
  traits?: RasgoApi[],
  options?: OptionsApi[],
  equipment?: EquipamientoApi[],
  equipment_options?: EquipamientoOpcionesApi[][],
  personalized_equipment: string[],
  options_name?: OptionsNameApi,
  traits_options?: TraitsOptionsApi
}

export interface OptionsNameApi {
  name: string,
  options: OptionSelectApi[],
  choose: number
}