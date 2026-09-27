import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { RaceLevelMongo, RaceRef } from "../domain/types/race.types";
import { TraitApi, TraitChoices, TraitDataMongo } from "../domain/types/traits.types";
import { resolveTraitActions } from "./resolveTraitActions";
import { resolveCharacterTraitChoices } from "./traitDamageChoices";

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
    traits_data: mergeTraitDataMaps(existingData, levelTraitsData),
  };
}

export function mergeClassAndRaceLevelUp(
  classTraits: TraitApi[],
  classTraitsData: TraitDataMongo | undefined,
  raceTraits: TraitApi[],
  raceTraitsData?: TraitDataMongo
): { traits: TraitApi[]; traits_data: TraitDataMongo } {
  const merged = mergeLevelUpTraits(
    classTraits.map(trait => trait.id).filter((id): id is string => Boolean(id)),
    classTraitsData,
    raceTraits,
    raceTraitsData
  );
  const byId = new Map<string, TraitApi>();
  for (const trait of [...classTraits, ...raceTraits]) {
    if (trait.id) byId.set(trait.id, trait);
  }

  return {
    traits: merged.traits.flatMap(id => {
      const trait = byId.get(id);
      return trait ? [trait] : [];
    }),
    traits_data: merged.traits_data
  };
}

export function mergeRaceLevelRows(
  parent: RaceLevelMongo | undefined,
  child: RaceLevelMongo | undefined
): RaceLevelMongo | undefined {
  if (!parent) return child ? copyRaceLevel(child) : undefined;
  if (!child) return copyRaceLevel(parent);

  return {
    level: child.level,
    traits_data: mergeTraitDataMaps(parent.traits_data, child.traits_data)
  };
}

function copyRaceLevel(row: RaceLevelMongo): RaceLevelMongo {
  return {
    level: row.level,
    traits_data: mergeTraitDataMaps(row.traits_data, undefined)
  };
}

export function traitIdsWithChangedData(
  current: TraitDataMongo | undefined,
  previous: TraitDataMongo | undefined
): string[] {
  const ids: string[] = [];
  for (const [traitId, tokens] of Object.entries(current ?? {})) {
    const previousTokens = previous?.[traitId];
    if (traitDataValuesDiffer(tokens, previousTokens)) {
      ids.push(traitId);
    }
  }
  return ids;
}

export function levelUpTraitIds(traits: TraitApi[], changedIds: string[]): string[] {
  const ids = traits.map(trait => trait.id).filter((id): id is string => Boolean(id));
  return [...new Set([...ids, ...changedIds])];
}

export function damageChoiceSourceIdsToLoad(traits: TraitApi[]): string[] {
  const loaded = new Set(traits.map(trait => trait.id).filter((id): id is string => Boolean(id)));
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const trait of traits) {
    const sourceId = trait.damageChoiceRef?.traitId;
    if (!sourceId || loaded.has(sourceId) || seen.has(sourceId)) continue;
    seen.add(sourceId);
    ids.push(sourceId);
  }

  return ids;
}

export function closeLevelUpTraitText(
  traits: TraitApi[],
  sources: TraitApi[],
  traitChoices: TraitChoices | null | undefined,
  racesById: ReadonlyMap<string, RaceRef>,
  attributes: CharacterAttributeApi[],
  proficiencyBonus: number
): TraitApi[] {
  const visibleIds = new Set(traits.map(trait => trait.id).filter((id): id is string => Boolean(id)));
  const extras = sources.filter(trait => trait.id && !visibleIds.has(trait.id));
  const resolved = resolveTraitActions(
    resolveCharacterTraitChoices([...extras, ...traits], traitChoices, racesById).traits,
    attributes,
    proficiencyBonus
  );
  const byId = new Map<string, TraitApi>();
  for (const trait of resolved) {
    if (trait.id) byId.set(trait.id, trait);
  }

  return traits.map(trait => (trait.id && byId.get(trait.id)) || trait);
}

export function orderTraitsByIds(traits: TraitApi[], ids: string[]): TraitApi[] {
  const byId = new Map<string, TraitApi>();
  for (const trait of traits) {
    if (trait.id) byId.set(trait.id, trait);
  }
  return ids.flatMap(id => {
    const trait = byId.get(id);
    return trait ? [trait] : [];
  });
}

function traitDataValuesDiffer(
  current: { [key: string]: string } | undefined,
  previous: { [key: string]: string } | undefined
): boolean {
  if (!current) return false;
  for (const key of Object.keys(current)) {
    if (!previous || current[key] !== previous[key]) {
      return true;
    }
  }
  return false;
}

export function mergeTraitDataMaps(
  base: TraitDataMongo | undefined,
  override: TraitDataMongo | undefined
): TraitDataMongo {
  const result: TraitDataMongo = {};
  for (const [traitId, tokens] of Object.entries(base ?? {})) {
    result[traitId] = { ...tokens };
  }
  for (const [traitId, tokens] of Object.entries(override ?? {})) {
    result[traitId] = { ...(result[traitId] ?? {}), ...tokens };
  }
  return result;
}
