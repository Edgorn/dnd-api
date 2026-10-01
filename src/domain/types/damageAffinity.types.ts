import { Damage } from "./damage.types";

export const DAMAGE_AFFINITY_SOURCES = ["any", "nonmagical_attacks"] as const;
export type DamageAffinitySource = typeof DAMAGE_AFFINITY_SOURCES[number];

export const DAMAGE_AFFINITY_BYPASSES = ["silvered", "adamantine"] as const;
export type DamageAffinityBypass = typeof DAMAGE_AFFINITY_BYPASSES[number];

export const CREATURE_DAMAGE_AFFINITY_FIELDS = [
  "damage_vulnerabilities",
  "damage_immunities",
  "damage_resistances"
] as const;

export type CreatureDamageAffinityField = typeof CREATURE_DAMAGE_AFFINITY_FIELDS[number];

/** Stored grant. One legacy damage type id becomes one grant; ids are not merged. */
export interface DamageAffinityGrant {
  damageTypeIds: string[];
  source: DamageAffinitySource;
  bypass: DamageAffinityBypass[];
}

export interface DamageAffinityGrantApi {
  damageTypes: Damage[];
  source: DamageAffinitySource;
  bypass: DamageAffinityBypass[];
}
