import { ObjectId } from "mongoose";

export interface MagicSchoolMongo {
  _id: ObjectId;
  ruleset: string;
  name: string;
  description: string;
  color: string;
  deletedAt?: Date | null;
}

export interface MagicSchoolApi {
  id: string;
  ruleset: string;
  name: string;
  description: string;
  color: string;
  deletedAt?: Date | null;
}

export type MagicSchoolApiPublic = Omit<MagicSchoolApi, 'deletedAt'>;

export interface InputCreateMagicSchool {
  ruleset: string;
  name: string;
  description: string;
  color: string;
}

export interface InputUpdateMagicSchool {
  id: string;
  name?: string;
  description?: string;
  color?: string;
}
