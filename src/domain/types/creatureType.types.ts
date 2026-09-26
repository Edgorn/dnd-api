import { ObjectId } from "mongoose";

export interface CreatureTypeMongo {
  _id: ObjectId;
  name: string;
  description?: string;
  ruleset: string;
  deletedAt?: Date | null;
}

export interface CreatureTypeApi {
  id: string;
  name: string;
  description?: string;
  ruleset: string;
  deletedAt?: Date | null;
}

export interface InputCreateCreatureType {
  name: string;
  description?: string;
  ruleset: string;
}

export interface InputUpdateCreatureType {
  id: string;
  name?: string;
  description?: string;
  ruleset?: string;
}
