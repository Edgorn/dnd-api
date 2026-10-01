import { Damage } from "../domain/types/damage.types";
import {
  DAMAGE_AFFINITY_BYPASSES,
  DamageAffinityBypass,
  DamageAffinityGrant,
  DamageAffinityGrantApi,
  DamageAffinitySource
} from "../domain/types/damageAffinity.types";

const bypassSet = new Set<string>(DAMAGE_AFFINITY_BYPASSES);

function isBypass(value: unknown): value is DamageAffinityBypass {
  return typeof value === "string" && bypassSet.has(value);
}

function resolveSource(value: unknown): DamageAffinitySource {
  return value === "nonmagical_attacks" ? "nonmagical_attacks" : "any";
}

function canonicalGrant(
  damageTypeIds: string[],
  source: DamageAffinitySource,
  bypass: DamageAffinityBypass[]
): DamageAffinityGrant {
  return {
    damageTypeIds,
    source,
    bypass: source === "nonmagical_attacks" ? bypass : []
  };
}

/**
 * Legacy string ids become one grant each (same order). Already-migrated objects
 * keep their ids together. Empty ids are dropped. Non-arrays become [].
 */
export function normalizeDamageAffinityList(raw: unknown): DamageAffinityGrant[] {
  if (!Array.isArray(raw)) return [];

  const result: DamageAffinityGrant[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (!item) continue;
      result.push(canonicalGrant([item], "any", []));
      continue;
    }

    if (!item || typeof item !== "object" || !("damageTypeIds" in item)) continue;

    const rawIds = (item as { damageTypeIds?: unknown }).damageTypeIds;
    const damageTypeIds = Array.isArray(rawIds)
      ? rawIds.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
    if (!damageTypeIds.length) continue;

    const source = resolveSource((item as { source?: unknown }).source);
    const rawBypass = (item as { bypass?: unknown }).bypass;
    const bypass = Array.isArray(rawBypass) ? rawBypass.filter(isBypass) : [];
    result.push(canonicalGrant(damageTypeIds, source, bypass));
  }

  return result;
}

export function collectDamageTypeIdsFromAffinities(...lists: unknown[]): string[] {
  const ids = new Set<string>();
  for (const list of lists) {
    for (const grant of normalizeDamageAffinityList(list)) {
      for (const id of grant.damageTypeIds) ids.add(id);
    }
  }
  return [...ids];
}

export function hydrateDamageAffinities(
  raw: unknown,
  damageById: Map<string, Damage>
): DamageAffinityGrantApi[] {
  return normalizeDamageAffinityList(raw).flatMap(grant => {
    const damageTypes = grant.damageTypeIds.flatMap(id => {
      const damage = damageById.get(id);
      return damage ? [damage] : [];
    });
    if (!damageTypes.length) return [];
    return [{
      damageTypes,
      source: grant.source,
      bypass: grant.bypass
    }];
  });
}

export function damageAffinityFieldNeedsWrite(
  stored: unknown,
  next: DamageAffinityGrant[]
): boolean {
  if (!Array.isArray(stored)) {
    return (stored !== undefined && stored !== null) || next.length > 0;
  }
  return JSON.stringify(stored) !== JSON.stringify(next);
}
