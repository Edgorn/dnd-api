import { TraitApi, TraitDataMongo } from "../domain/types/traits.types";

export function mergeLevelUpTraits(
  existingIds: string[],
  existingData: TraitDataMongo | undefined,
  levelTraits: TraitApi[],
  levelTraitsData?: TraitDataMongo
): { traits: string[]; traits_data: TraitDataMongo } {
  const owned = new Set(existingIds);
  const added = levelTraits
    .map(trait => trait.id)
    .filter((id): id is string => Boolean(id) && !owned.has(id));

  return {
    traits: [...existingIds, ...added],
    traits_data: { ...(existingData ?? {}), ...(levelTraitsData ?? {}) },
  };
}
