import { TraitUses, TraitWeaponDamageBonus } from "../domain/types/traits.types";
import { collectClassGrantedTraitIds, TraitLevelRow } from "./traitHitPoints";

export interface TraitActionProgression {
  uses?: TraitUses;
  usesByClassLevel?: Record<string, TraitUses>;
}

export interface CharacterClassLevelEntry {
  class: string;
  level: number;
}

export interface ClassCatalogForTraits {
  id: string;
  levels?: TraitLevelRow[];
}

export interface SubclassCatalogForTraits {
  classId: string;
  levels?: TraitLevelRow[];
}

export function lookupByClassLevel<T>(
  map: Record<string, T> | undefined,
  classLevel: number
): T | undefined {
  if (!map) return undefined;
  let best: { level: number; value: T } | undefined;
  for (const [key, value] of Object.entries(map)) {
    const level = Number(key);
    if (!Number.isInteger(level) || level < 1 || level > classLevel) continue;
    if (!best || level > best.level) best = { level, value };
  }
  return best?.value;
}

export function resolveActionUses(
  action: TraitActionProgression | undefined,
  classLevel: number | undefined
): TraitUses | undefined {
  if (!action) return undefined;
  const fromTable =
    classLevel !== undefined ? lookupByClassLevel(action.usesByClassLevel, classLevel) : undefined;
  if (fromTable !== undefined) return fromTable;
  return action.uses;
}

export function resolveWeaponDamageAmount(
  bonus: TraitWeaponDamageBonus | undefined,
  classLevel: number | undefined
): number | undefined {
  if (!bonus) return undefined;
  const fromTable =
    classLevel !== undefined ? lookupByClassLevel(bonus.amountByClassLevel, classLevel) : undefined;
  if (fromTable !== undefined) return fromTable;
  return bonus.amount;
}

export function resolveActionRemaining(uses: TraitUses | undefined, spent: number): TraitUses | undefined {
  if (uses === undefined) return undefined;
  if (uses === "unlimited") return "unlimited";
  return Math.max(0, uses - spent);
}

export function buildTraitGrantingClassLevels(
  classes: CharacterClassLevelEntry[],
  catalogs: ClassCatalogForTraits[],
  subclasses: SubclassCatalogForTraits[]
): Map<string, number> {
  const catalogById = new Map(catalogs.map(item => [item.id, item]));
  const result = new Map<string, number>();

  for (const entry of classes) {
    const classLevel = entry.level;
    const catalog = catalogById.get(entry.class);
    const subclassLevels = subclasses
      .filter(item => item.classId === entry.class)
      .flatMap(item => item.levels ?? []);
    const granted = collectClassGrantedTraitIds(
      catalog?.levels ?? [],
      subclassLevels,
      classLevel
    );
    for (const traitId of granted) {
      const previous = result.get(traitId) ?? 0;
      if (classLevel > previous) result.set(traitId, classLevel);
    }
  }

  return result;
}
