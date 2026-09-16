import { TraitApi, TraitDataMongo } from "./traits.types";

export interface SubclassLevelInput {
  level: number;
  traits?: string[];
  traits_data?: TraitDataMongo;
}

export interface SubclassLevelMongo {
  level: number;
  traits: string[];
  traits_data: TraitDataMongo;
}

export interface SubclassLevelApi {
  level: number;
  traits: TraitApi[];
  traits_data: TraitDataMongo;
}

export interface InputCreateSubclass {
  ruleset: string;
  classId: string;
  name: string;
  description?: string[];
  img?: string;
  levels?: SubclassLevelInput[];
}

export interface InputUpdateSubclass {
  id: string;
  ruleset?: string;
  classId?: string;
  name?: string;
  description?: string[];
  img?: string;
  levels?: SubclassLevelInput[];
}

export interface SubclassMongo {
  _id?: any;
  ruleset: string;
  classId: string;
  name: string;
  description: string[];
  img: string;
  levels: SubclassLevelMongo[];
  deletedAt?: Date | null;
}

export interface SubclassApi {
  id: string;
  ruleset: string;
  classId: string;
  name: string;
  description: string[];
  img: string;
  levels: SubclassLevelApi[];
  deletedAt?: Date | null;
}
