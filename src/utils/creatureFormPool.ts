import {
  CreatureFormApi,
  CreatureFormPoolApi,
  CreatureFormPoolStored,
  CreatureFormStored
} from "../domain/types/creatureForm.types";
import type { CreatureApi } from "../domain/types/creature.types";
import type { CreatureTypeApi } from "../domain/types/creatureType.types";

export interface CreatureFormPoolMatchTarget {
  id: string;
  creatureTypeId?: string;
  creatureType?: { id: string };
  challenge_rating: number;
  size: string;
  tags?: string[];
}

export function storedPoolFromCreatureForm(
  form: Pick<CreatureFormStored, "pool"> | { pool: CreatureFormPoolApi }
): CreatureFormPoolStored {
  const pool = form.pool;
  if (pool.mode === "ids") {
    const creatureIds = "creatures" in pool
      ? [
          ...("creatureIds" in pool ? pool.creatureIds ?? [] : []),
          ...pool.creatures.map(creature => creature.id)
        ]
      : pool.creatureIds;
    return { mode: "ids", creatureIds: [...new Set(creatureIds)] };
  }

  const creatureTypeIds = "creatureTypes" in pool && pool.creatureTypes?.length
    ? pool.creatureTypes.map(type => type.id)
    : pool.creatureTypeIds;

  return {
    mode: "filter",
    ...(creatureTypeIds?.length ? { creatureTypeIds } : {}),
    ...(pool.maxCR !== undefined ? { maxCR: pool.maxCR } : {}),
    ...(pool.sizes?.length ? { sizes: pool.sizes } : {}),
    ...(pool.tags?.length ? { tags: pool.tags } : {})
  };
}

export function creatureMatchesFormPool(
  pool: CreatureFormPoolStored | CreatureFormPoolApi,
  creature: CreatureFormPoolMatchTarget
): boolean {
  const stored = storedPoolFromCreatureForm({ pool });
  if (stored.mode === "ids") {
    return stored.creatureIds.includes(creature.id);
  }

  if (stored.creatureTypeIds?.length) {
    const typeId = creature.creatureTypeId ?? creature.creatureType?.id;
    if (!typeId || !stored.creatureTypeIds.includes(typeId)) {
      return false;
    }
  }

  if (stored.maxCR !== undefined && creature.challenge_rating > stored.maxCR) {
    return false;
  }

  if (stored.sizes?.length && !stored.sizes.includes(creature.size)) {
    return false;
  }

  if (stored.tags?.length) {
    const tags = creature.tags ?? [];
    if (!stored.tags.every(tag => tags.includes(tag))) {
      return false;
    }
  }

  return true;
}

export function creatureMatchesAnyFormPool(
  pools: Array<CreatureFormPoolStored | CreatureFormPoolApi>,
  creature: CreatureFormPoolMatchTarget
): boolean {
  return pools.some(pool => creatureMatchesFormPool(pool, creature));
}

export interface TraitFormExtensionSource {
  spellId: string;
  extraPool: CreatureFormPoolStored | CreatureFormPoolApi;
}

export function extraFormPoolsForSpell(
  spellId: string,
  traits: Array<{ creatureFormExtensions?: TraitFormExtensionSource[] }>
): Array<CreatureFormPoolStored | CreatureFormPoolApi> {
  return traits.flatMap(trait =>
    (trait.creatureFormExtensions ?? [])
      .filter(extension => extension.spellId === spellId)
      .map(extension => extension.extraPool)
  );
}

export function formPoolsForSpell(
  spell: { id?: string; creatureForm?: { pool: CreatureFormPoolStored | CreatureFormPoolApi } },
  traits: Array<{ creatureFormExtensions?: TraitFormExtensionSource[] }>
): Array<CreatureFormPoolStored | CreatureFormPoolApi> {
  const pools: Array<CreatureFormPoolStored | CreatureFormPoolApi> = [];
  if (spell.creatureForm?.pool) pools.push(spell.creatureForm.pool);
  if (spell.id) pools.push(...extraFormPoolsForSpell(spell.id, traits));
  return pools;
}

export function formatCreatureFormPool(
  pool: CreatureFormPoolStored | CreatureFormPoolApi,
  creatureById: Map<string, CreatureApi>,
  typeById: Map<string, CreatureTypeApi>
): CreatureFormPoolApi {
  const stored = storedPoolFromCreatureForm({ pool });
  if (stored.mode === "ids") {
    const creatureIds = stored.creatureIds;
    return {
      mode: "ids",
      creatureIds,
      creatures: creatureIds.flatMap(id => {
        const creature = creatureById.get(id);
        return creature ? [creature] : [];
      })
    };
  }

  const creatureTypeIds = stored.creatureTypeIds ?? [];
  return {
    mode: "filter",
    ...(creatureTypeIds.length ? { creatureTypeIds } : {}),
    ...(creatureTypeIds.length
      ? {
          creatureTypes: creatureTypeIds.flatMap(id => {
            const type = typeById.get(id);
            return type ? [type] : [];
          })
        }
      : {}),
    ...(stored.maxCR !== undefined ? { maxCR: stored.maxCR } : {}),
    ...(stored.sizes?.length ? { sizes: stored.sizes } : {}),
    ...(stored.tags?.length ? { tags: stored.tags } : {})
  };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

export function overlaySpellCreatureForm(
  form: CreatureFormApi | undefined,
  extraPools: CreatureFormPoolApi[]
): CreatureFormApi | undefined {
  if (!form) return undefined;
  if (!extraPools.length) return form;

  if (form.pool.mode === "ids" && extraPools.every(pool => pool.mode === "ids")) {
    const creatureIds = uniqueIds([
      ...form.pool.creatureIds,
      ...extraPools.flatMap(pool => pool.creatureIds)
    ]);
    const creaturesById = new Map<string, CreatureApi>();
    for (const creature of [
      ...form.pool.creatures,
      ...extraPools.flatMap(pool => pool.creatures)
    ]) {
      creaturesById.set(creature.id, creature);
    }
    return {
      ...form,
      pool: {
        mode: "ids",
        creatureIds,
        creatures: creatureIds.flatMap(id => {
          const creature = creaturesById.get(id);
          return creature ? [creature] : [];
        })
      }
    };
  }

  return { ...form, extraPools };
}

export function overlaySpellsCreatureForms<T extends { id?: string; creatureForm?: CreatureFormApi }>(
  spells: T[],
  traits: Array<{ creatureFormExtensions?: Array<{ spellId: string; extraPool: CreatureFormPoolApi }> }>
): T[] {
  return spells.map(spell => {
    if (!spell.id || !spell.creatureForm) return spell;
    const extraPools = traits.flatMap(trait =>
      (trait.creatureFormExtensions ?? [])
        .filter(extension => extension.spellId === spell.id)
        .map(extension => extension.extraPool)
    );
    const overlay = overlaySpellCreatureForm(spell.creatureForm, extraPools);
    if (!overlay || overlay === spell.creatureForm) return spell;
    return { ...spell, creatureForm: overlay };
  });
}
