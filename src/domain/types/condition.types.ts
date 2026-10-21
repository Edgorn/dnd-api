import { ObjectId } from "mongoose";

export interface ConditionLevel {
  level: number;
  description: string;
}

export interface ConditionRecovery {
  restKey: string;
  delta: number;
}

export interface ConditionMongo {
  _id: ObjectId;
  name: string;
  description?: string;
  ruleset: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
  recovery?: ConditionRecovery[];
  deletedAt?: Date | null;
}

export interface ConditionApi {
  id: string;
  name: string;
  description?: string;
  ruleset: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
  recovery?: ConditionRecovery[];
  deletedAt?: Date | null;
}

export interface InputCreateCondition {
  name: string;
  description?: string;
  ruleset: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
  recovery?: ConditionRecovery[];
}

export interface InputUpdateCondition {
  id: string;
  name?: string;
  description?: string;
  ruleset?: string;
  levels?: ConditionLevel[];
  cumulative?: boolean;
  recovery?: ConditionRecovery[];
}
