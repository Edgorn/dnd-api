import {
  TraitChoiceValue,
  TraitChoices,
  TraitSkillProficiency,
  TraitSkillProficiencyChoice
} from "../domain/types/traits.types";

export interface SkillProficiencyTarget {
  id: string;
  attributeScore?: string[];
}

function overlayMatchesSkill(
  skill: SkillProficiencyTarget,
  overlay: TraitSkillProficiency
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
  overlays: TraitSkillProficiency[] | undefined
): number {
  let value = current;
  for (const overlay of overlays ?? []) {
    if (!overlayMatchesSkill(skill, overlay)) continue;
    value = Math.max(value, overlay.value);
  }
  return value;
}

export interface SkillProficiencyChoiceTrait {
  id?: string;
  skills?: string[];
  skillProficiencyChoices?: TraitSkillProficiencyChoice[];
}

export interface PendingSkillProficiencyChoiceDraft {
  traitId: string;
  key: string;
  add: number;
  value: TraitSkillProficiencyChoice["value"];
  chosen: string[];
  optionIds: string[];
}

function skillProficiencyRequired(choice: TraitSkillProficiencyChoice, classLevel: number): number {
  return choice.grants.reduce(
    (sum, grant) => (grant.atLevel <= classLevel ? sum + grant.choose : sum),
    0
  );
}

function storedSkillIds(values: TraitChoiceValue[] | undefined): string[] {
  if (!values?.length) return [];
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

function sameIds(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function readSkillIdSelection(
  incoming: TraitChoices | null | undefined,
  traitId: string,
  key: string
): { ids?: string[] } | { error: string } {
  const choices = incoming?.[traitId];
  if (!choices || !(key in choices)) return {};

  const sent = choices[key];
  if (!Array.isArray(sent)) {
    return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
  }

  const ids = sent.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (ids.length !== sent.length) {
    return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
  }

  return { ids };
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

export function listPendingSkillProficiencyChoices(input: {
  existing?: TraitChoices | null;
  classLevel: number;
  grantedTraits: SkillProficiencyChoiceTrait[];
  proficientIds: Iterable<string>;
}): PendingSkillProficiencyChoiceDraft[] {
  const stored = input.existing ?? {};
  const proficient = new Set(input.proficientIds);
  const pending: PendingSkillProficiencyChoiceDraft[] = [];

  for (const trait of input.grantedTraits) {
    if (!trait.id || !trait.skillProficiencyChoices?.length) continue;

    for (const choice of trait.skillProficiencyChoices) {
      const chosen = storedSkillIds(stored[trait.id]?.[choice.key]);
      const required = skillProficiencyRequired(choice, input.classLevel);
      const add = required - chosen.length;
      if (add <= 0) continue;

      const chosenSet = new Set(chosen);
      pending.push({
        traitId: trait.id,
        key: choice.key,
        add,
        value: choice.value,
        chosen,
        optionIds: [...proficient].filter(id => !chosenSet.has(id))
      });
    }
  }

  return pending;
}

export function applySkillProficiencyChoices(input: {
  existing?: TraitChoices | null;
  incoming?: TraitChoices | null;
  classLevel: number;
  grantedTraits: SkillProficiencyChoiceTrait[];
  proficientIds: Iterable<string>;
}): { traitChoices: TraitChoices } | { error: string } {
  const traitChoices: TraitChoices = {};
  for (const [traitId, choices] of Object.entries(input.existing ?? {})) {
    if (!choices || typeof choices !== "object") continue;
    traitChoices[traitId] = { ...choices };
  }
  const proficient = new Set(input.proficientIds);

  for (const trait of input.grantedTraits) {
    if (!trait.id || !trait.skillProficiencyChoices?.length) continue;

    for (const choice of trait.skillProficiencyChoices) {
      const stored = storedSkillIds(traitChoices[trait.id]?.[choice.key]);
      const required = skillProficiencyRequired(choice, input.classLevel);
      const sent = readSkillIdSelection(input.incoming, trait.id, choice.key);
      if ("error" in sent) return sent;

      if (stored.length >= required) {
        if (sent.ids && !sameIds(stored, sent.ids)) {
          return { error: `La elección ${choice.key} del rasgo ${trait.id} ya está guardada` };
        }
        continue;
      }

      if (!sent.ids) {
        return {
          error: `Debe elegir las habilidades (${choice.key}) del rasgo ${trait.id}`
        };
      }

      const add = required - stored.length;
      if (sent.ids.length !== required || !sameIds(stored, sent.ids.slice(0, stored.length))) {
        return {
          error: `La elección ${choice.key} del rasgo ${trait.id} debe conservar las opciones ya elegidas y añadir ${add}`
        };
      }

      const added = sent.ids.slice(stored.length);
      const seen = new Set(stored);
      for (const id of added) {
        if (seen.has(id)) {
          return { error: `La skill ${id} está repetida en la elección ${choice.key} del rasgo ${trait.id}` };
        }
        if (!proficient.has(id)) {
          return { error: `La skill ${id} no es una competencia del personaje` };
        }
        seen.add(id);
      }

      if (!traitChoices[trait.id]) traitChoices[trait.id] = {};
      traitChoices[trait.id][choice.key] = [...sent.ids];
    }
  }

  return { traitChoices };
}

export function collectChosenSkillProficiencies(
  traits: SkillProficiencyChoiceTrait[] | undefined,
  traitChoices?: TraitChoices | null,
  proficientIds?: Iterable<string>
): TraitSkillProficiency[] {
  const proficient = proficientIds ? new Set(proficientIds) : undefined;
  const overlays: TraitSkillProficiency[] = [];

  for (const trait of traits ?? []) {
    if (!trait.id || !trait.skillProficiencyChoices?.length) continue;
    for (const choice of trait.skillProficiencyChoices) {
      const chosen = storedSkillIds(traitChoices?.[trait.id]?.[choice.key])
        .filter(id => !proficient || proficient.has(id));
      if (!chosen.length) continue;
      overlays.push({ value: choice.value, skillIds: chosen });
    }
  }

  return overlays;
}
