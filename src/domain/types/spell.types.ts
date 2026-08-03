import { ObjectId } from "mongoose";
import { MagicSchoolApi } from "./magicSchool.types";

export type SpellSchoolApi = Pick<MagicSchoolApi, 'id' | 'description' | 'name' | 'color'>;

export interface CastingTime {
  value: number;
  unit: string;
  condition?: string;
}

export interface SpellRangeArea {
  shape: string;
  value: number;
  unit: string;
}

export interface SpellRange {
  type: string;
  value?: number;
  unit?: string;
  area?: SpellRangeArea;
}

export interface SpellComponents {
  verbal: boolean;
  somatic: boolean;
  material: boolean;
  materialsDescription?: string;
}

export interface SpellDuration {
  type: string;
  value?: number;
  unit?: string;
  concentration: boolean;
}

export interface SpellMongo {
  _id?: ObjectId;
  ruleset: string;
  name: string;
  type?: string;
  level: number;
  classes: string[];
  typeName?: string;
  school?: any;
  castingTime?: CastingTime;
  range?: SpellRange;
  components?: SpellComponents;
  duration?: SpellDuration;
  description: string[];
  ritual?: boolean;
  deletedAt?: Date | null;
}

export interface SpellApi {
  id?: string;
  ruleset: string;
  name: string;
  type?: string;
  level: number;
  classes: string[];
  typeName?: string;
  school?: SpellSchoolApi;
  castingTime?: CastingTime;
  range?: SpellRange;
  components?: SpellComponents;
  duration?: SpellDuration;
  description: string[];
  ritual?: boolean;
  deletedAt?: Date | null;
}

export interface InputCreateSpell {
  ruleset: string;
  name: string;
  description: string[];
  level: number;
  classes: string[];
  school?: string;
  castingTime?: CastingTime;
  range?: SpellRange;
  components?: SpellComponents;
  duration?: SpellDuration;
}

export interface InputUpdateSpell {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string[];
  level?: number;
  classes?: string[];
  school?: string;
  castingTime?: CastingTime;
  range?: SpellRange;
  components?: SpellComponents;
  duration?: SpellDuration;
}

export interface ChoiceSpell {
  choose: number;
  level: number;
  class: string;
}
