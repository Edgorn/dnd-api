import { TraitSkillProficiency } from "../domain/types/traits.types";

export interface SkillProficiencyTarget {
  id: string;
  attributeScore?: string[];
}

export type SkillProficiencyOverlay = {
  value: number;
  skillIds?: string[];
  attributeKeys?: string[];
};

function overlayMatchesSkill(
  skill: SkillProficiencyTarget,
  overlay: SkillProficiencyOverlay
): boolean {
  if (overlay.skillIds?.length && !overlay.skillIds.includes(skill.id)) {
    return false;
  }

  if (overlay.attributeKeys?.length) {
    const attributes = skill.attributeScore ?? [];
    if (!overlay.attributeKeys.some(key => attributes.includes(key))) {
      return false;
    }
  }

  return true;
}

export function collectTraitSkillProficiencies(
  traits: Array<{ skillProficiencies?: TraitSkillProficiency[] }> | undefined
): TraitSkillProficiency[] {
  return (traits ?? []).flatMap(trait => trait.skillProficiencies ?? []);
}

export function maxSkillProficiencyValue(
  current: number,
  skill: SkillProficiencyTarget,
  overlays: SkillProficiencyOverlay[] | undefined
): number {
  let value = current;
  for (const overlay of overlays ?? []) {
    if (!overlayMatchesSkill(skill, overlay)) continue;
    value = Math.max(value, overlay.value);
  }
  return value;
}

export function collectProficientSkillIds(
  skillIds: string[] | undefined,
  traits: Array<{ skills?: string[] }> | undefined
): string[] {
  const ids = new Set<string>();
  for (const id of skillIds ?? []) {
    if (id) ids.add(id);
  }
  for (const trait of traits ?? []) {
    for (const id of trait.skills ?? []) {
      if (id) ids.add(id);
    }
  }
  return [...ids];
}
