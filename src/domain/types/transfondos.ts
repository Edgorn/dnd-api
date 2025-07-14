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
  money: {
    quantity: Number,
    unit: String
  },
  god: Boolean,
  personality_traits: String[],
  ideals: String[],
  bonds: String[],
  flaws: String[]
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
  equipment_options: EquipamientoOpcionesApi[];
  money: {
    quantity: Number,
    unit: String
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
  }[]
}