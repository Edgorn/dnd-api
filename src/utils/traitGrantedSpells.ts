import { collectClassGrantedTraitIds } from "./traitHitPoints";
import type { CharacterClassLevelEntry, ClassCatalogForTraits, SubclassCatalogForTraits } from "./traitProgression";
import type { TraitGrantedSpell } from "../domain/types/traits.types";

export interface GrantedSpellTrait {
  id: string;
  grantedSpells?: TraitGrantedSpell[];
}

export interface GrantedSpellOptionSelection {
  traitId: string;
  classId: string;
}

export interface GrantedSpellInput {
  traits: GrantedSpellTrait[];
  optionSelections?: GrantedSpellOptionSelection[];
  classes: CharacterClassLevelEntry[];
  classCatalogs: ClassCatalogForTraits[];
  subclasses: SubclassCatalogForTraits[];
}

function classIdsGrantingTrait(
  traitId: string,
  optionSelections: GrantedSpellOptionSelection[],
  classes: CharacterClassLevelEntry[],
  catalogs: ClassCatalogForTraits[],
  subclasses: SubclassCatalogForTraits[]
): string[] {
  const fromOptions = [...new Set(
    optionSelections
      .filter(selection => selection.traitId === traitId && selection.classId)
      .map(selection => selection.classId)
  )];
  if (fromOptions.length) return fromOptions;

  const catalogById = new Map(catalogs.map(item => [item.id, item]));
  const fromLevels = new Set<string>();
  for (const entry of classes) {
    const subclassLevels = subclasses
      .filter(item => item.classId === entry.class)
      .flatMap(item => item.levels ?? []);
    const granted = collectClassGrantedTraitIds(
      catalogById.get(entry.class)?.levels ?? [],
      subclassLevels,
      entry.level
    );
    if (granted.has(traitId)) fromLevels.add(entry.class);
  }
  return [...fromLevels];
}

function collectGrantedExtrasByClass(input: GrantedSpellInput): Record<string, Map<string, boolean>> {
  const result: Record<string, Map<string, boolean>> = {};
  const selections = input.optionSelections ?? [];

  for (const trait of input.traits) {
    const grants = trait.grantedSpells ?? [];
    if (!grants.length) continue;

    const classIds = classIdsGrantingTrait(
      trait.id,
      selections,
      input.classes,
      input.classCatalogs,
      input.subclasses
    );
    const targets = classIds.length ? classIds : ["race"];
    for (const classId of targets) {
      const map = result[classId] ?? new Map<string, boolean>();
      for (const grant of grants) {
        const current = map.get(grant.spellId);
        map.set(grant.spellId, current === undefined ? grant.ritualOnly : current && grant.ritualOnly);
      }
      result[classId] = map;
    }
  }

  return result;
}

export function grantedExtraSpellIdsByClass(input: GrantedSpellInput): Record<string, string[]> {
  const collected = collectGrantedExtrasByClass(input);
  const result: Record<string, string[]> = {};
  for (const [classId, map] of Object.entries(collected)) {
    result[classId] = [...map.keys()];
  }
  return result;
}

export function ritualOnlyGrantedExtraIdsByClass(input: GrantedSpellInput): Record<string, string[]> {
  const collected = collectGrantedExtrasByClass(input);
  const result: Record<string, string[]> = {};
  for (const [classId, map] of Object.entries(collected)) {
    const ids = [...map.entries()]
      .filter(([, ritualOnly]) => ritualOnly)
      .map(([spellId]) => spellId);
    if (ids.length) result[classId] = ids;
  }
  return result;
}

export function ritualOnlyExtraSpellIds(params: {
  extraIds: string[];
  persistedExtraIds: string[];
  otherDerivedExtraIds: string[];
  ritualOnlyFromTraits: string[];
}): string[] {
  const blocked = new Set([...params.persistedExtraIds, ...params.otherDerivedExtraIds]);
  const ritual = new Set(params.ritualOnlyFromTraits);
  return params.extraIds.filter(id => ritual.has(id) && !blocked.has(id));
}

export function mergeExtraSpellIds(
  persisted: string[],
  derived: string[],
  knownIds: string[]
): string[] {
  const known = new Set(knownIds);
  const merged: string[] = [];
  const seen = new Set<string>();
  for (const id of [...persisted, ...derived]) {
    if (!id || seen.has(id) || known.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged;
}
