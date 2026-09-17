import type { Types } from "mongoose";

export interface FeatAttributeRequirementCreate {
  key: string;
  min: number;
}

export interface FeatAttributeRequirement {
  key: string;
  name: string;
  min: number;
  icon?: string;
}

export interface FeatRequirementsCreate {
  attributeMode?: "all" | "any";
  attributes?: FeatAttributeRequirementCreate[];
}

export interface FeatRequirements {
  attributeMode: "all" | "any";
  attributes: FeatAttributeRequirement[];
}

export interface FeatMongo {
  _id: Types.ObjectId;
  name: string;
  desc?: string[];
  description?: string[];
  summary?: string[];
  ruleset: string;
  requirements?: FeatRequirementsCreate | null;
  deletedAt?: Date | null;
}

export interface FeatApi {
  id: string;
  name: string;
  description: string[];
  summary: string[];
  ruleset: string;
  requirements: FeatRequirements;
  deletedAt?: Date | null;
}

export interface InputCreateFeat {
  name: string;
  description?: string[];
  summary?: string[];
  ruleset: string;
  requirements?: FeatRequirementsCreate;
}

export interface InputUpdateFeat {
  id: string;
  name?: string;
  description?: string[];
  summary?: string[];
  ruleset?: string;
  requirements?: FeatRequirementsCreate | null;
}
