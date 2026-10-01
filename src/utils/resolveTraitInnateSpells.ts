import { TraitInnateSpells, TraitInnateSpellsApi } from "../domain/types/traits.types";

export function resolveTraitInnateSpells<T extends TraitInnateSpells | TraitInnateSpellsApi>(
  innateSpells: T | undefined | null,
  characterLevel: number
): T | undefined {
  if (!innateSpells) return undefined;

  return {
    ...innateSpells,
    grants: innateSpells.grants.filter(grant => grant.atLevel <= characterLevel)
  };
}
