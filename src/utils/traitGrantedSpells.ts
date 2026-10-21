import { collectClassGrantedTraitIds, TraitLevelRow } from "./traitHitPoints";
import type { CharacterClassLevelEntry, ClassCatalogForTraits, SubclassCatalogForTraits } from "./traitProgression";

export interface GrantedSpellTrait {
  id: string;
  grantedSpells?: Array<string | { id?: string }>;
}

export interface GrantedSpellOptionSelection {
  traitId: string;
  classId: string;
}

function grantedSpellIds(trait: GrantedSpellTrait): string[] {
  return (trait.grantedSpells ?? [])
    .map(entry => (typeof entry === "string" ? entry : entry.id))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

function addSpell(target: Record<string, string[]>, classId: string, spellId: string): void {
  const current = target[classId] ?? [];
  if (current.includes(spellId)) return;
  target[classId] = [...current, spellId];
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

export function grantedExtraSpellIdsByClass(input: {
  traits: GrantedSpellTrait[];
  optionSelections?: GrantedSpellOptionSelection[];
  classes: CharacterClassLevelEntry[];
  classCatalogs: ClassCatalogForTraits[];
  subclasses: SubclassCatalogForTraits[];
}): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const selections = input.optionSelections ?? [];

  for (const trait of input.traits) {
    const spellIds = grantedSpellIds(trait);
    if (!spellIds.length) continue;

    const classIds = classIdsGrantingTrait(
      trait.id,
      selections,
      input.classes,
      input.classCatalogs,
      input.subclasses
    );
    const targets = classIds.length ? classIds : ["race"];
    for (const classId of targets) {
      for (const spellId of spellIds) {
        addSpell(result, classId, spellId);
      }
    }
  }

  return result;
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
