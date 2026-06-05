import { ObjectId } from "mongoose";
import { CaracteristicaApi } from "./caracteristica.types";

export interface System {
  _id: ObjectId;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
}

export interface SystemApi {
  id: string;
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
  canEdit: boolean;
  racesCount: number;
  languagesCount: number;
  traitsCount: number;
  caracteristicas: CaracteristicaApi[];
}

export interface TypeCrearSystem {
  name: string;
  description: string;
  publisher: string;
  isOpen: boolean;
}

export interface TypeModificarSystem {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  isOpen?: boolean;
}