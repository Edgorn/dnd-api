import {
  EntityOverrideApi,
  RACE_FLAVOR_FIELDS,
  RaceFlavorField,
  RaceFlavorPatch,
  RaceFlavorPatchInput
} from "../domain/types/entityOverride.types";
import { System } from "../domain/types/system.types";

export interface RaceOverlayTarget {
  id: string;
  name: string;
  description?: string[];
  img?: string;
  alignment?: string;
  ruleset: string;
  inherited?: boolean;
  overriddenFields?: RaceFlavorField[];
  overrideRuleset?: string;
  subraces?: {
    name: string;
    list: RaceOverlayTarget[];
  };
}

export interface AncestrySystemRef {
  id: string;
  name?: string;
}

export function isMeaningfulFlavorValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "string" && value === "") return false;
  return true;
}

export function sanitizeFlavorPatch(patch: RaceFlavorPatch): RaceFlavorPatch {
  const next: RaceFlavorPatch = {};

  for (const key of RACE_FLAVOR_FIELDS) {
    const value = patch[key];
    if (!isMeaningfulFlavorValue(value)) continue;

    if (key === "description") {
      next.description = value as string[];
    } else if (key === "name") {
      next.name = value as string;
    } else if (key === "img") {
      next.img = value as string;
    } else {
      next.alignment = value as string;
    }
  }

  return next;
}

export function mergeFlavorPatch(
  current: RaceFlavorPatch,
  incoming: RaceFlavorPatchInput
): RaceFlavorPatch {
  const next: RaceFlavorPatch = { ...current };

  for (const key of RACE_FLAVOR_FIELDS) {
    if (!(key in incoming) || incoming[key] === undefined) continue;
    if (incoming[key] === null) {
      delete next[key];
      continue;
    }
    if (!isMeaningfulFlavorValue(incoming[key])) continue;

    if (key === "description") {
      next.description = incoming.description ?? undefined;
    } else if (key === "name") {
      next.name = incoming.name ?? undefined;
    } else if (key === "img") {
      next.img = incoming.img ?? undefined;
    } else {
      next.alignment = incoming.alignment ?? undefined;
    }
  }

  return sanitizeFlavorPatch(next);
}

export function systemMatchesRuleset(system: AncestrySystemRef, ruleset: string): boolean {
  return system.id === ruleset || system.name === ruleset;
}

export function applyRaceOverrides<T extends RaceOverlayTarget>(
  races: T[],
  overlays: EntityOverrideApi[],
  ancestry: AncestrySystemRef[]
): T[] {
  if (ancestry.length === 0) return races;

  return races.map(race => applyRaceOverride(race, overlays, ancestry));
}

export function applyRaceNameOverrides<T extends { id: string; name: string; ruleset: string }>(
  items: T[],
  overlays: EntityOverrideApi[],
  ancestry: AncestrySystemRef[]
): T[] {
  if (ancestry.length === 0) return items;

  return items.map(item => {
    let name = item.name;
    for (let i = ancestry.length - 1; i >= 0; i--) {
      const system = ancestry[i];
      const overlay = overlays.find(
        entry => entry.sourceId === item.id && systemMatchesRuleset(system, entry.ruleset)
      );
      const patched = overlay?.patch.name;
      if (patched === undefined || !isMeaningfulFlavorValue(patched)) continue;
      name = String(patched);
    }
    return name === item.name ? item : { ...item, name };
  });
}

export function raceDescriptionTeaser(description: string[] | undefined, maxChars = 200): string | undefined {
  const first = description?.find(paragraph => typeof paragraph === "string" && paragraph.trim().length > 0)?.trim();
  if (!first) return undefined;
  if (first.length <= maxChars) return first;
  return `${first.slice(0, maxChars).trimEnd()}…`;
}

function applyRaceOverride<T extends RaceOverlayTarget>(
  race: T,
  overlays: EntityOverrideApi[],
  ancestry: AncestrySystemRef[]
): T {
  const viewingSystem = ancestry[0];
  const inherited = !systemMatchesRuleset(viewingSystem, race.ruleset);

  let result: T = { ...race, inherited };
  const overriddenFields: RaceFlavorField[] = [];
  let overrideRuleset: string | undefined;

  for (let i = ancestry.length - 1; i >= 0; i--) {
    const system = ancestry[i];
    const overlay = overlays.find(
      item => item.sourceId === race.id && systemMatchesRuleset(system, item.ruleset)
    );
    if (!overlay) continue;

    for (const key of RACE_FLAVOR_FIELDS) {
      const value = overlay.patch[key];
      if (value === undefined || !isMeaningfulFlavorValue(value)) continue;
      result = applyFlavorField(result, key, value);
      if (!overriddenFields.includes(key)) {
        overriddenFields.push(key);
      }
      overrideRuleset = system.id;
    }
  }

  if (overriddenFields.length > 0) {
    result = { ...result, overriddenFields, overrideRuleset };
  }

  if (result.subraces?.list.length) {
    result = {
      ...result,
      subraces: {
        ...result.subraces,
        list: applyRaceOverrides(result.subraces.list as T[], overlays, ancestry)
      }
    };
  }

  return result;
}

function applyFlavorField<T extends RaceOverlayTarget>(
  race: T,
  key: RaceFlavorField,
  value: string | string[]
): T {
  switch (key) {
    case "name":
      return { ...race, name: String(value) };
    case "description":
      return { ...race, description: Array.isArray(value) ? value : [value] };
    case "img":
      return { ...race, img: String(value) };
    case "alignment":
      return { ...race, alignment: String(value) };
  }
}

export function ancestryToRefs(ancestry: System[]): AncestrySystemRef[] {
  return ancestry.map(system => ({
    id: system._id.toString(),
    name: system.name
  }));
}

export function ancestryRulesets(ancestry: System[]): string[] {
  const rulesets: string[] = [];
  for (const system of ancestry) {
    rulesets.push(system._id.toString());
    if (system.name) rulesets.push(system.name);
  }
  return rulesets;
}
