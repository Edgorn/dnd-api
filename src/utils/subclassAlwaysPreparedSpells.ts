export interface AlwaysPreparedSpellRowRef {
  atLevel: number;
  spellIds: string[];
}

function collectAlwaysPreparedSpellIds(
  subclasses: Array<{ classId: string; alwaysPreparedSpells?: AlwaysPreparedSpellRowRef[] }>,
  classId: string,
  includeRow: (atLevel: number) => boolean
): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const subclass of subclasses) {
    if (subclass.classId !== classId) continue;
    for (const row of subclass.alwaysPreparedSpells ?? []) {
      if (!Number.isInteger(row.atLevel) || !includeRow(row.atLevel)) continue;
      for (const id of row.spellIds ?? []) {
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}

export function subclassAlwaysPreparedSpellIds(
  subclasses: Array<{ classId: string; alwaysPreparedSpells?: AlwaysPreparedSpellRowRef[] }>,
  classId: string,
  classLevel: number
): string[] {
  return collectAlwaysPreparedSpellIds(
    subclasses,
    classId,
    atLevel => atLevel <= classLevel
  );
}

export function subclassAlwaysPreparedSpellRowsAtLevel(
  subclasses: Array<{ classId: string; alwaysPreparedSpells?: AlwaysPreparedSpellRowRef[] }>,
  classId: string,
  classLevel: number
): AlwaysPreparedSpellRowRef[] {
  const spellIds = collectAlwaysPreparedSpellIds(
    subclasses,
    classId,
    atLevel => atLevel === classLevel
  );
  return spellIds.length ? [{ atLevel: classLevel, spellIds }] : [];
}
