import { ObjectId } from "mongoose";

export const ENTITY_OVERRIDE_TYPES = ["race"] as const;
export type EntityOverrideType = (typeof ENTITY_OVERRIDE_TYPES)[number];

export const RACE_FLAVOR_FIELDS = ["name", "description", "img", "alignment"] as const;
export type RaceFlavorField = (typeof RACE_FLAVOR_FIELDS)[number];

export interface RaceFlavorPatch {
  name?: string;
  description?: string[];
  img?: string;
  alignment?: string;
}

export type RaceFlavorPatchInput = {
  [K in RaceFlavorField]?: RaceFlavorPatch[K] | null;
};

export interface EntityOverrideMongo {
  _id: ObjectId;
  ruleset: string;
  entityType: EntityOverrideType;
  sourceId: string;
  patch: RaceFlavorPatch;
  deletedAt?: Date | null;
}

export interface EntityOverrideApi {
  id: string;
  ruleset: string;
  entityType: EntityOverrideType;
  sourceId: string;
  patch: RaceFlavorPatch;
}

export interface UpsertEntityOverride {
  ruleset: string;
  entityType: EntityOverrideType;
  sourceId: string;
  patch: RaceFlavorPatch;
}
