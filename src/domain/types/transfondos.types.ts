import { ChoiceApi, ChoiceMongo, EquipamientoApi, EquipamientoMongo, EquipamientoOpcionesApi, EquipamientoOpcionesMongo, MixedChoicesApi, MixedChoicesMongo, OptionsApi, OptionSelectApi, OptionsMongo } from ".";
import { CompetenciaApi } from "./competencias.types";
import { HabilidadApi } from "./habilidades.types";
import { IdiomaApi } from "./idiomas.types";
import { RasgoApi, TraitsOptionsApi, TraitsOptionsMongo } from "./rasgos.types";

export interface TransfondoMongo {
  index: string,
  name: string,
  desc: string[],
  img: string,
  traits: string[],
  traits_options?: TraitsOptionsMongo,
  skills: string[],
  language_choices?: ChoiceMongo,
  proficiencies: string[],
  proficiencies_choices?: ChoiceMongo[],
  starting_equipment: EquipamientoMongo[];
  starting_equipment_options: EquipamientoOpcionesMongo[][];
  personalized_equipment: string[],
  money: {
    quantity: number,
    unit: string
  },
  options_name?: OptionsNameMongo,
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
  traits_options?: TraitsOptionsMongo,
  proficiencies_choices?: ChoiceMongo[],
  mixed_choices?: MixedChoicesMongo[][],
  starting_equipment: EquipamientoMongo[],
  starting_equipment_options?: EquipamientoOpcionesMongo[][],
  personalized_equipment: string[],
  options_name?: OptionsNameMongo
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
  traits_options?: TraitsOptionsApi,
  skills?: HabilidadApi[],
  language_choices?: ChoiceApi<IdiomaApi>,
  proficiencies: CompetenciaApi[],
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  equipment: EquipamientoApi[];
  equipment_options: EquipamientoOpcionesApi[][];
  personalized_equipment: string[],
  money: {
    quantity: number,
    unit: string
  },
  options_name?: OptionsNameApi,
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
  traits_options?: TraitsOptionsApi,
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  mixed_choices?: MixedChoicesApi[][],
  equipment?: EquipamientoApi[],
  equipment_options?: EquipamientoOpcionesApi[][],
  personalized_equipment: string[],
  options_name?: OptionsNameApi   
}

export interface OptionsNameApi {
  name: string,
  options: OptionSelectApi[],
  choose: number
}