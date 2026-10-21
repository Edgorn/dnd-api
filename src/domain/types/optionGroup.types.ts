import type { Types } from "mongoose";
import { Prerequisite } from "./prerequisite.types";
import { TraitApi } from "./traits.types";

export interface OptionChoiceMongo {
  groupId: string;
  choose: number;
  replace?: number;
}

/** Recambio de opciones de un grupo en cada nivel de clase, a partir de que el personaje ya tenga alguna. */
export interface OptionReplacementConfig {
  groupId: string;
  count: number;
}

export interface OptionGroupMongo {
  _id: Types.ObjectId;
  ruleset: string;
  name: string;
  description: string[];
  deletedAt?: Date | null;
}

export interface OptionGroupApi {
  id: string;
  ruleset: string;
  name: string;
  description: string[];
  deletedAt?: Date | null;
}

export interface InputCreateOptionGroup {
  ruleset: string;
  name: string;
  description?: string[];
}

export interface InputUpdateOptionGroup {
  id: string;
  name?: string;
  description?: string[] | null;
}

export interface GroupOptionMongo {
  _id: Types.ObjectId;
  ruleset: string;
  groupId: string;
  traitId: string;
  prerequisites?: Prerequisite | null;
  repeatable?: boolean;
  deletedAt?: Date | null;
}

export interface GroupOptionApi {
  id: string;
  ruleset: string;
  groupId: string;
  traitId: string;
  trait?: TraitApi;
  prerequisites?: Prerequisite | null;
  repeatable?: boolean;
  deletedAt?: Date | null;
}

export interface InputCreateGroupOption {
  ruleset: string;
  groupId: string;
  traitId: string;
  prerequisites?: Prerequisite;
  repeatable?: boolean;
}

export interface InputUpdateGroupOption {
  id: string;
  groupId?: string;
  traitId?: string;
  prerequisites?: Prerequisite | null;
  repeatable?: boolean;
}

export interface CharacterOptionSelection {
  optionId: string;
  groupId: string;
  traitId: string;
  classId: string;
  level: number;
}

export interface CharacterOptionSelectionApi extends CharacterOptionSelection {
  groupName?: string;
  trait?: TraitApi;
}

export interface LevelUpOptionPick {
  groupId: string;
  add: string[];
  replace?: { from: string; to: string }[];
}

export interface PendingOptionChoiceOption extends GroupOptionApi {
  available: boolean;
  unmet: boolean;
}

export interface PendingOptionChoice {
  groupId: string;
  groupName: string;
  choose: number;
  replace?: number;
  options: PendingOptionChoiceOption[];
  selected: CharacterOptionSelection[];
}
