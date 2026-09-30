import { ObjectId } from "mongoose";

export interface ConditionLevel {
  level: number;
  description: string;
}

export interface ConditionMongo {
  _id: ObjectId;
  name: string;
  description?: string;
  ruleset: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
  deletedAt?: Date | null;
}

export interface ConditionApi {
  id: string;
  name: string;
  description?: string;
  ruleset: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
  deletedAt?: Date | null;
}

export interface InputCreateCondition {
  name: string;
  description?: string;
  ruleset: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
}

export interface InputUpdateCondition {
  id: string;
  name?: string;
  description?: string;
  ruleset?: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
}
