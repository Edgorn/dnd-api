import { ObjectId } from "mongoose";
import { MagicSchoolApi } from "./magicSchool.types";
import { Damage } from "./damage.types";

export type SpellSchoolApi = Pick<MagicSchoolApi, 'id' | 'description' | 'name' | 'color'>;
export type SpellDamageTypeApi = Pick<Damage, 'id' | 'description' | 'name' | 'color'>;

export interface DamageComponentMongo {
  diceCount: number;
  diceType: string;
  type: any;
}

export interface DamageComponentApi {
  diceCount: number;
  diceType: string;
  type: SpellDamageTypeApi;
}

export type SpellDamageScalingMode = "per_slot_level" | "character_level";
export type SpellDamageScalingStepType = "add" | "override";

export interface ScalingStepMongo {
  level: number;
  type: SpellDamageScalingStepType;
  components: DamageComponentMongo[];
}

export interface SpellDamageScalingMongo {
  mode: SpellDamageScalingMode;
  steps: ScalingStepMongo[];
}

export interface ScalingStepApi {
  level: number;
  type: SpellDamageScalingStepType;
  components: DamageComponentApi[];
}

export interface SpellDamageScalingApi {
  mode: SpellDamageScalingMode;
  steps: ScalingStepApi[];
}

export interface InputScalingStep {
  level: number;
  type: SpellDamageScalingStepType;
  components: InputDamageComponent[];
}

export interface InputSpellDamageScaling {
  mode: SpellDamageScalingMode;
  steps: InputScalingStep[];
}

export interface SpellDamageMongo {
  base: DamageComponentMongo[];
  scaling?: SpellDamageScalingMongo;
}

export interface SpellDamageApi {
  base: DamageComponentApi[];
  scaling?: SpellDamageScalingApi;
}

export interface InputDamageComponent {
  diceCount: number;
  diceType: string;
  type: string;
}

export interface InputSpellDamage {
  base: InputDamageComponent[];
  scaling?: InputSpellDamageScaling;
}

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
  damage?: SpellDamageMongo;
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
  damage?: SpellDamageApi;
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
  damage?: InputSpellDamage;
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
  damage?: InputSpellDamage;
}

export interface ChoiceSpell {
  choose: number;
  level: number;
  class: string;
}
