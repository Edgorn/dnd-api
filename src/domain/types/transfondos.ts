import { EquipamientoApi, EquipamientoMongo, EquipamientoOpcionesApi, EquipamientoOpcionesMongo, OptionsApi, OptionsMongo, ProficienciesApi, ProficienciesMongo, RasgoApi } from ".";

export interface TransfondoMongo {
  index: string;
  name: string;
  desc: string[];
  img: string;
  traits: string[];
  starting_proficiencies: ProficienciesMongo[];
  options: OptionsMongo[];
  starting_equipment: EquipamientoMongo[];
  starting_equipment_options: EquipamientoOpcionesMongo[][];
  personalized_equipment: String[],
  money: {
    quantity: Number,
    unit: String
  },
  options_name?: {
    name: String,
    options: String[],
    choose: Number
  },
  traits_options?: {
    name: string,
    options: string[]
  },
  god: Boolean,
  personality_traits: String[],
  ideals: String[],
  bonds: String[],
  flaws: String[],
  variants: VarianteMongo[]
}

export interface TransfondoApi {
  index: string;
  name: string;
  desc: string[];
  img: string;
  traits: RasgoApi[]
  proficiencies: ProficienciesApi[]
  options: OptionsApi[];
  equipment: EquipamientoApi[];
  equipment_options: EquipamientoOpcionesApi[][];
  personalized_equipment: String[],
  money: {
    quantity: Number,
    unit: String
  },
  options_name?: {
    name: String,
    options: {
      label: String,
      value: String
    }[],
    choose: Number
  },
  traits_options?: {
    name: string,
    options: RasgoApi[]
  },
  god: Boolean,
  personality_traits: { 
    label: String, 
    value: String 
  }[],
  ideals: { 
    label: String, 
    value: String 
  }[],
  bonds: { 
    label: String, 
    value: String 
  }[],
  flaws: { 
    label: String, 
    value: String 
  }[],
  variants: VarianteApi[]
}

export interface VarianteMongo {
  name?: String,
  desc?: String[],
  traits?: string[],
  options?: OptionsMongo[],
  starting_equipment: EquipamientoMongo[],
  starting_equipment_options?: EquipamientoOpcionesMongo[][],
  personalized_equipment: String[],
  options_name?: {
    name: String,
    options: String[],
    choose: Number
  },
  traits_options?: {
    name: string,
    options: string[]
  }
}

export interface VarianteApi {
  name?: String,
  desc?: String[],
  traits?: RasgoApi[],
  options?: OptionsApi[],
  equipment?: EquipamientoApi[],
  equipment_options?: EquipamientoOpcionesApi[][],
  personalized_equipment: String[],
  options_name?: {
    name: String,
    options: {
      label: String,
      value: String
    }[],
    choose: Number
  },
  traits_options?: {
    name: string,
    options: RasgoApi[]
  }
}