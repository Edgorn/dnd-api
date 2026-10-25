import { LevelSkillProficiencyChoice } from "../domain/types/classLevelChoices.types";
import { CharacterSkillProficiencyOverlay } from "../domain/types/character.types";

export type { CharacterSkillProficiencyOverlay };

export function overlaysToSkillProficiencies(
  overlays: CharacterSkillProficiencyOverlay[] | undefined
): Array<{ value: number; skillIds: string[] }> {
  return (overlays ?? []).map(overlay => ({
    value: overlay.value,
    skillIds: [overlay.skillId]
  }));
}

export function overlayValueForSkill(
  overlays: CharacterSkillProficiencyOverlay[] | undefined,
  skillId: string
): number {
  let value = 0;
  for (const overlay of overlays ?? []) {
    if (overlay.skillId === skillId) {
      value = Math.max(value, overlay.value);
    }
  }
  return value;
}

export function pendingLevelSkillProficiencyChoices(input: {
  grants: LevelSkillProficiencyChoice[] | undefined;
  proficientIds: Iterable<string>;
  overlays?: CharacterSkillProficiencyOverlay[];
}): Array<{ add: number; value: LevelSkillProficiencyChoice["value"]; optionIds: string[] }> {
  const proficient = [...new Set(input.proficientIds)].filter(Boolean);
  const pending: Array<{ add: number; value: LevelSkillProficiencyChoice["value"]; optionIds: string[] }> = [];

  for (const grant of input.grants ?? []) {
    const optionIds = proficient.filter(
      id => overlayValueForSkill(input.overlays, id) < grant.value
    );
    if (grant.choose < 1) continue;
    pending.push({
      add: grant.choose,
      value: grant.value,
      optionIds
    });
  }

  return pending;
}

export function applyLevelSkillProficiencyPicks(input: {
  grants: LevelSkillProficiencyChoice[] | undefined;
  proficientIds: Iterable<string>;
  overlays?: CharacterSkillProficiencyOverlay[];
  picks?: string[];
}): { overlays: CharacterSkillProficiencyOverlay[] } | { error: string } {
  const pending = pendingLevelSkillProficiencyChoices(input);
  const required = pending.reduce((sum, item) => sum + item.add, 0);
  const picks = input.picks ?? [];

  if (!required) {
    if (picks.length) {
      return { error: "skillProficiencyPicks no aplica en esta subida" };
    }
    return { overlays: [...(input.overlays ?? [])] };
  }

  if (picks.length !== required) {
    return { error: `Debe elegir ${required} habilidad(es) con bonificador extra` };
  }

  const overlays = [...(input.overlays ?? [])];
  const proficient = new Set(input.proficientIds);
  let offset = 0;

  for (const grant of pending) {
    const group = picks.slice(offset, offset + grant.add);
    offset += grant.add;
    const optionSet = new Set(grant.optionIds);
    const seen = new Set<string>();

    for (const id of group) {
      if (seen.has(id)) {
        return { error: `La skill ${id} está repetida en skillProficiencyPicks` };
      }
      if (!proficient.has(id)) {
        return { error: `La skill ${id} no es una competencia del personaje` };
      }
      if (!optionSet.has(id) || overlayValueForSkill(overlays, id) >= grant.value) {
        return { error: `La skill ${id} no puede recibir el bonificador ${grant.value}` };
      }
      seen.add(id);
      overlays.push({ skillId: id, value: grant.value });
    }
  }

  return { overlays };
}

export function concatExtraSpellIds(
  extraSpells: Record<string, string[]> | undefined,
  classId: string,
  ids: string[]
): Record<string, string[]> | undefined {
  if (!ids.length) return extraSpells;
  const current = extraSpells && typeof extraSpells === "object" ? { ...extraSpells } : {};
  current[classId] = [...(Array.isArray(current[classId]) ? current[classId] : []), ...ids];
  return current;
}

export function getExtraSpellIds(
  extraSpells: Record<string, string[]> | undefined,
  classId: string
): string[] {
  const ids = extraSpells?.[classId];
  return Array.isArray(ids) ? ids : [];
}
