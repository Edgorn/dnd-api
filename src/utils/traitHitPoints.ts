import { TraitHitPoints } from "../domain/types/traits.types";

export interface TraitHitPointBonusTrait {
  id: string;
  hitPoints?: TraitHitPoints;
}

export interface TraitHitPointBonusInput {
  traits: TraitHitPointBonusTrait[];
  classGrantedTraitIds: Iterable<string>;
  classLevel: number;
  characterLevel: number;
  previouslyOwnedIds: Iterable<string>;
}

export interface TraitLevelRow {
  level: number;
  traits?: Array<string | { id: string }>;
}

function traitIdsFromLevelRow(traits?: TraitLevelRow["traits"]): string[] {
  if (!traits?.length) return [];
  return traits.map(entry => (typeof entry === "string" ? entry : entry.id));
}

export function collectClassGrantedTraitIds(
  classLevels: TraitLevelRow[],
  subclassLevels: TraitLevelRow[],
  maxLevel: number
): Set<string> {
  const ids = new Set<string>();
  const addFromLevels = (levels: TraitLevelRow[]) => {
    for (const row of levels) {
      if (row.level > maxLevel) continue;
      for (const traitId of traitIdsFromLevelRow(row.traits)) {
        ids.add(traitId);
      }
    }
  };
  addFromLevels(classLevels);
  addFromLevels(subclassLevels);
  return ids;
}

function toIdSet(ids: Iterable<string>): Set<string> {
  const set = new Set<string>();
  for (const id of ids) {
    set.add(id);
  }
  return set;
}

export function traitHitPointBonus(input: TraitHitPointBonusInput): number {
  const ownedBefore = toIdSet(input.previouslyOwnedIds);
  const classCatalog = toIdSet(input.classGrantedTraitIds);
  let bonus = 0;
  const processed = new Set<string>();

  for (const trait of input.traits) {
    if (processed.has(trait.id)) continue;
    processed.add(trait.id);

    const hitPoints = trait.hitPoints;
    if (!hitPoints?.perLevel) continue;

    const perLevel = hitPoints.perLevel;
    const hadTrait = ownedBefore.has(trait.id);

    if (hitPoints.scope === "class") {
      if (!classCatalog.has(trait.id)) continue;
      bonus += hadTrait ? perLevel : perLevel * input.classLevel;
      continue;
    }

    bonus += hadTrait ? perLevel : perLevel * input.characterLevel;
  }

  return bonus;
}
