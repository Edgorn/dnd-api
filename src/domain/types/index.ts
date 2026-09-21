import { Number } from "mongoose";

export interface ChoiceMongo {
  choose: number;
  options?: string[];
  filter?: Record<string, string | number | (string | number)[]>;
}

export interface ChoiceApi<T> {
  choose: number;
  options: T[];
  query_type?: "all" | "options" | "filter";
  query_filter?: Record<string, string | number | (string | number)[]>;
}

export interface OptionSelectApi {
  label: string,
  value: string
}

export interface AbilityBonusesMongo {
  index: string,
  bonus: number
}

export interface AbilityBonusesApi {
  index: string,
  name: string,
  bonus: number
}

export * from "./damage.types";


export interface OptionsMongo {
  type: string,
  options: OptionsMongo[] | string[],
  api?: string,
  choose: number
}

export interface OptionsApi {
  options: ({ index: string; name: string; } | OptionsApi)[],
  choose: number,
  type: string,
  //spell?: any
}

export interface EquipamientoOpcionesApi {
  items: {
    index: String,
    quantity: Number
  }[],
  name: String
}

export * from "./property.types";

export interface Speed {
  walk: number
  fly?: number
  climb?: number
  swim?: number
  burrow?: number
}