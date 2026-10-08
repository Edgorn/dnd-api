import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { RaceLevelMongo, RaceRef } from "../domain/types/race.types";
import { TraitApi, TraitChoices, TraitDataMongo } from "../domain/types/traits.types";
import { resolveTraitActions } from "./resolveTraitActions";
import { resolveCharacterTraitChoices } from "./traitDamageChoices";

export function applyTraitStacking(
  owned: TraitApi[],
  incoming: TraitApi[]
): { granted: TraitApi[]; nextIds: string[] } {
  const ownedIds: string[] = [];
  const ownedById = new Map<string, TraitApi>();
  const stackBest = new Map<string, { id: string; rank: number; exclusive: boolean }>();
  const ownedIncompatible = new Set<string>();

  for (const trait of owned) {
    if (!trait.id) continue;
    ownedIds.push(trait.id);
    ownedById.set(trait.id, trait);
    rememberStackGroup(stackBest, trait);
    for (const incompatible of trait.incompatible_traits ?? []) {
      if (incompatible.id) ownedIncompatible.add(incompatible.id);
    }
  }

  const granted: TraitApi[] = [];
  const replaced = new Set<string>();

  for (const trait of incoming) {
    if (!trait.id) continue;
    if (ownedById.has(trait.id)) continue;
    if (ownedIncompatible.has(trait.id)) continue;
    if ((trait.incompatible_traits ?? []).some(item => item.id && ownedById.has(item.id))) continue;

    const group = trait.stackGroup;
    if (group?.key) {
      const existing = stackBest.get(group.key);
      if (existing) {
        if (group.policy === "exclusive" || existing.exclusive) continue;
        const rank = group.rank ?? 0;
        if (rank <= existing.rank) continue;
        replaced.add(existing.id);
        ownedById.delete(existing.id);
      }
      rememberStackGroup(stackBest, trait);
    }

    granted.push(trait);
    ownedById.set(trait.id, trait);
  }

  return {
    granted,
    nextIds: [
      ...ownedIds.filter(id => !replaced.has(id)),
      ...granted.map(trait => trait.id).filter((id): id is string => Boolean(id))
    ]
  };
}

function rememberStackGroup(
  stackBest: Map<string, { id: string; rank: number; exclusive: boolean }>,
  trait: TraitApi
): void {
  const group = trait.stackGroup;
  if (!group?.key || !trait.id) return;
  const rank = group.policy === "max" ? (group.rank ?? 0) : 0;
  const exclusive = group.policy === "exclusive";
  const previous = stackBest.get(group.key);
  if (!previous || rank > previous.rank || (exclusive && !previous.exclusive)) {
    stackBest.set(group.key, { id: trait.id, rank, exclusive });
  }
}

export function mergeLevelUpTraits(
  existingIds: string[],
  existingData: TraitDataMongo | undefined,
  levelTraits: TraitApi[],
  levelTraitsData?: TraitDataMongo,
  ownedTraits?: TraitApi[]
): { traits: string[]; traits_data: TraitDataMongo; granted: TraitApi[] } {
  const owned = ownedTraits ?? existingIds.map(id => ({
    id,
    name: id,
    description: [],
    summary: [],
    ruleset: "",
    incompatible_traits: [],
    resistances: [],
    conditional_resistances: [],
    condition_inmunities: [],
    proficiencies: []
  }));
  const stacking = applyTraitStacking(owned, levelTraits);

  return {
    traits: stacking.nextIds,
    traits_data: mergeTraitDataMaps(existingData, levelTraitsData),
    granted: stacking.granted
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
