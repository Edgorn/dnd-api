export type CatalogExclusionSource = {
  excludedRaceIds?: string[] | null;
  excludedClassIds?: string[] | null;
};

export type RaceForestNode<T> = {
  id: string;
  subraces?: {
    name: string;
    list: T[];
  };
};

export function mergeCatalogExclusions(
  systems: CatalogExclusionSource[]
): { raceIds: Set<string>; classIds: Set<string> } {
  const raceIds = new Set<string>();
  const classIds = new Set<string>();

  for (const system of systems) {
    for (const id of system.excludedRaceIds ?? []) {
      if (id) raceIds.add(id.toString());
    }
    for (const id of system.excludedClassIds ?? []) {
      if (id) classIds.add(id.toString());
    }
  }

  return { raceIds, classIds };
}

export function isRaceExcluded(
  raceId: string,
  ancestorRaceIdsChain: string[],
  excludedRaceIds: Iterable<string>
): boolean {
  const excluded = excludedRaceIds instanceof Set
    ? excludedRaceIds
    : new Set(excludedRaceIds);
  if (excluded.has(raceId)) return true;
  return ancestorRaceIdsChain.some((id) => excluded.has(id));
}

export function pruneRaceForest<T extends RaceForestNode<T>>(
  forest: T[],
  excludedRaceIds: Iterable<string>
): T[] {
  const excluded = excludedRaceIds instanceof Set
    ? excludedRaceIds
    : new Set(excludedRaceIds);
  if (excluded.size === 0) return forest;

  return forest.flatMap((node) => {
    if (excluded.has(node.id)) return [];

    if (!node.subraces) return [node];

    const list = pruneRaceForest(node.subraces.list, excluded);
    if (list.length === 0) {
      const { subraces: _removed, ...rest } = node;
      return [rest as T];
    }

    return [{
      ...node,
      subraces: { name: node.subraces.name, list },
    }];
  });
}

export function pruneRaceCatalog<T extends { id: string; parentId?: string | null }>(
  items: T[],
  excludedRaceIds: Iterable<string>
): T[] {
  const excluded = excludedRaceIds instanceof Set
    ? excludedRaceIds
    : new Set(excludedRaceIds);
  if (excluded.size === 0) return items;

  const byId = new Map(items.map((item) => [item.id, item]));
  const memo = new Map<string, boolean>();

  const hidden = (id: string, seen: Set<string>): boolean => {
    const cached = memo.get(id);
    if (cached !== undefined) return cached;
    if (excluded.has(id)) {
      memo.set(id, true);
      return true;
    }
    if (seen.has(id)) {
      memo.set(id, false);
      return false;
    }
    seen.add(id);
    const parentId = byId.get(id)?.parentId ?? null;
    if (!parentId) {
      memo.set(id, false);
      return false;
    }
    const result = excluded.has(parentId) || hidden(parentId, seen);
    memo.set(id, result);
    return result;
  };

  return items.filter((item) => !hidden(item.id, new Set()));
}

export function filterExcludedById<T extends { id: string }>(
  items: T[],
  excludedIds: Iterable<string>
): T[] {
  const excluded = excludedIds instanceof Set ? excludedIds : new Set(excludedIds);
  if (excluded.size === 0) return items;
  return items.filter((item) => !excluded.has(item.id));
}

export function filterSubclassesByExcludedClasses<T extends { classId: string }>(
  items: T[],
  excludedClassIds: Iterable<string>
): T[] {
  const excluded = excludedClassIds instanceof Set
    ? excludedClassIds
    : new Set(excludedClassIds);
  if (excluded.size === 0) return items;
  return items.filter((item) => !excluded.has(item.classId));
}

export function toIdStrings(ids?: Array<string | { toString(): string }> | null): string[] {
  if (!ids) return [];
  return ids.map((id) => id.toString());
}
