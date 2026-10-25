import type { CreatureApi } from "./creature.types";
import type { CreatureTypeApi } from "./creatureType.types";

export const CREATURE_FORM_PURPOSES = ["companion", "self", "target"] as const;
export type CreatureFormPurpose = (typeof CREATURE_FORM_PURPOSES)[number];

export function formPurposeOverlaysCharacter(
  purpose?: CreatureFormPurpose
): boolean {
  return purpose === "self" || purpose === "target";
}

export const CREATURE_FORM_POOL_MODES = ["ids", "filter"] as const;
export type CreatureFormPoolMode = (typeof CREATURE_FORM_POOL_MODES)[number];

export interface CreatureFormPoolIdsStored {
  mode: "ids";
  creatureIds: string[];
}

export interface CreatureFormPoolFilterStored {
  mode: "filter";
  creatureTypeIds?: string[];
  maxCR?: number;
  sizes?: string[];
  tags?: string[];
}

export type CreatureFormPoolStored = CreatureFormPoolIdsStored | CreatureFormPoolFilterStored;

export interface CreatureFormStored {
  purpose: CreatureFormPurpose;
  choose: number;
  replaceOnRecast: boolean;
  pool: CreatureFormPoolStored;
}

export interface CreatureFormPoolIdsApi {
  mode: "ids";
  creatureIds: string[];
  creatures: CreatureApi[];
}

export interface CreatureFormPoolFilterApi {
  mode: "filter";
  creatureTypeIds?: string[];
  creatureTypes?: CreatureTypeApi[];
  maxCR?: number;
  sizes?: string[];
  tags?: string[];
}

export type CreatureFormPoolApi = CreatureFormPoolIdsApi | CreatureFormPoolFilterApi;

export interface CreatureFormApi {
  purpose: CreatureFormPurpose;
  choose: number;
  replaceOnRecast: boolean;
  pool: CreatureFormPoolApi;
  extraPools?: CreatureFormPoolApi[];
}

export interface InputCreatureForm {
  purpose: CreatureFormPurpose;
  choose?: number;
  replaceOnRecast?: boolean;
  pool: CreatureFormPoolStored;
}

export interface CharacterFormMongo {
  id: string;
  creatureId: string;
  spellId?: string;
  purpose?: CreatureFormPurpose;
}

export interface CreatureFormSummary {
  id: string;
  name: string;
  size: string;
  cr: number;
}

export interface CharacterFormApi {
  id: string;
  purpose?: CreatureFormPurpose;
  spellId?: string;
  spell?: { id: string; name: string };
  creature?: CreatureApi | CreatureFormSummary;
  active?: boolean;
}
