import { ObjectId } from "mongoose";

export interface CaracteristicaMongo {
  _id: ObjectId;
  ruleset: string[];
  name: string;
  description: string;
  key: string;
  abbreviation: string;
}

export interface CaracteristicaApi {
  id: string;
  ruleset: string[];
  name: string;
  description: string;
  key: string;
  abbreviation: string;
}

export interface InputCrearCaracteristica {
  ruleset: string;
  name: string;
  description: string;
  key: string;
  abbreviation: string;
}

export interface InputModificarCaracteristica {
  id: string;
  name?: string;
  description?: string;
  key?: string;
  abbreviation?: string;
}

export interface CaracteristicaBonusCreate {
  key: string;
  bonus: number;
}

export interface CaracteristicaBonus {
  key: string;
  name: string;
  bonus: number;
}

export interface AtributoPersonajeApi {
  id: string;
  name: string;
  description: string;
  key: string;
  abbreviation: string;
  value: number;
  modifier?: number;
}