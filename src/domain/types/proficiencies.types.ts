import { ObjectId } from "mongoose";

export interface ProficiencyMongo {
  _id: ObjectId,
  name: string;
  type: string;
  parentProficiencyId: ObjectId | null;
  ruleset: string;
  deletedAt: Date | null;
}

export interface ProficiencyApi {
  id: string;
  name: string;
  type: string;
  parentProficiencyId: string | null;
  ruleset: string;
  deletedAt: Date | null;
}
