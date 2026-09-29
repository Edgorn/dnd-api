import { ObjectId } from "mongoose";

export interface ConditionMongo {
  _id: ObjectId;
  name: string;
  description?: string;
  ruleset: string;
  deletedAt?: Date | null;
}

export interface ConditionApi {
  id: string;
  name: string;
  description?: string;
  ruleset: string;
  deletedAt?: Date | null;
}

export interface InputCreateCondition {
  name: string;
  description?: string;
  ruleset: string;
}

export interface InputUpdateCondition {
  id: string;
  name?: string;
  description?: string;
  ruleset?: string;
}
