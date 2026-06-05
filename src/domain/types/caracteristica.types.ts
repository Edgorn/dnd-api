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
  ruleset: string; // Recibido como string desde la vista de sistemas
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
