import { restKindCovers } from "../domain/services/restRules";
import { ConditionApi, ConditionLevel, ConditionRecovery } from "../domain/types/condition.types";
import { CharacterActiveCondition } from "../domain/types/character.types";
import { SystemRestRules } from "../domain/types/system.types";

export function maxConditionLevel(levels?: ConditionLevel[]): number {
  if (!levels?.length) return 0;
  return levels.reduce((max, row) => Math.max(max, row.level), 0);
}

export function normalizeActiveConditions(raw: unknown): CharacterActiveCondition[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map<string, CharacterActiveCondition>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const conditionId = (item as { conditionId?: unknown }).conditionId;
    const level = (item as { level?: unknown }).level;
    if (typeof conditionId !== "string" || conditionId.length === 0) continue;
    if (level === undefined) {
      byId.set(conditionId, { conditionId });
      continue;
    }
    if (typeof level !== "number" || !Number.isInteger(level) || level < 1) continue;
    const previous = byId.get(conditionId)?.level ?? 0;
    byId.set(conditionId, { conditionId, level: Math.max(previous, level) });
  }

  return [...byId.values()];
}

export function immuneConditionIdsFromTraits(
  traits: Array<{
    id?: string;
    condition_inmunities?: Array<{ id?: string }>;
    conditionalConditionImmunities?: Array<{ id?: string }>;
  }>,
  activeTraitIds: string[]
): Set<string> {
  const ids = new Set<string>();
  const active = new Set(activeTraitIds);

  for (const trait of traits) {
    for (const condition of trait.condition_inmunities ?? []) {
      if (condition.id) ids.add(condition.id);
    }
    if (!trait.id || !active.has(trait.id)) continue;
    for (const condition of trait.conditionalConditionImmunities ?? []) {
      if (condition.id) ids.add(condition.id);
    }
  }

  return ids;
}

export function applyCondition(input: {
  condition: Pick<ConditionApi, "id" | "levels">;
  current: CharacterActiveCondition[];
  addLevel?: number;
  immuneIds: Set<string>;
}): { ok: true; next: CharacterActiveCondition[] } | { ok: false; message: string } {
  if (input.immuneIds.has(input.condition.id)) {
    return { ok: false, message: "El personaje es inmune a este estado" };
  }

  const add = input.addLevel ?? 1;
  if (!Number.isInteger(add) || add < 1) {
    return { ok: false, message: "El nivel añadido debe ser un entero positivo" };
  }

  const maxLevel = maxConditionLevel(input.condition.levels);
  const existing = input.current.find((item) => item.conditionId === input.condition.id);

  if (maxLevel === 0) {
    if (existing) {
      return { ok: false, message: "El personaje ya tiene este estado" };
    }
    return { ok: true, next: [...input.current, { conditionId: input.condition.id }] };
  }

  const currentLevel = existing?.level ?? 0;
  const nextLevel = Math.min(maxLevel, currentLevel + add);
  return { ok: true, next: upsertCondition(input.current, input.condition.id, nextLevel) };
}

export function applyConditionDelta(input: {
  condition: Pick<ConditionApi, "id" | "levels">;
  current: CharacterActiveCondition[];
  delta: number;
}): { ok: true; next: CharacterActiveCondition[] } | { ok: false; message: string } {
  if (!Number.isInteger(input.delta) || input.delta === 0) {
    return { ok: false, message: "El cambio de nivel no puede ser 0" };
  }

  const existing = input.current.find((item) => item.conditionId === input.condition.id);
  if (!existing) {
    return { ok: false, message: "El personaje no tiene este estado" };
  }

  const maxLevel = maxConditionLevel(input.condition.levels);
  const currentLevel = existing.level ?? 1;
  if (maxLevel === 0) {
    if (input.delta < 0) {
      return { ok: true, next: input.current.filter((item) => item.conditionId !== input.condition.id) };
    }
    return { ok: false, message: "Este estado no tiene niveles" };
  }

  const nextLevel = currentLevel + input.delta;
  if (nextLevel < 1) {
    return { ok: true, next: input.current.filter((item) => item.conditionId !== input.condition.id) };
  }
  return { ok: true, next: upsertCondition(input.current, input.condition.id, Math.min(maxLevel, nextLevel)) };
}

export function removeCondition(
  current: CharacterActiveCondition[],
  conditionId: string
): { ok: true; next: CharacterActiveCondition[] } | { ok: false; message: string } {
  if (!current.some((item) => item.conditionId === conditionId)) {
    return { ok: false, message: "El personaje no tiene este estado" };
  }
  return { ok: true, next: current.filter((item) => item.conditionId !== conditionId) };
}

export function applyConditionRestRecovery(input: {
  current: CharacterActiveCondition[];
  catalogs: Array<Pick<ConditionApi, "id" | "levels" | "recovery">>;
  restType: string;
  restRules?: SystemRestRules;
}): CharacterActiveCondition[] {
  const catalogById = new Map(input.catalogs.map((item) => [item.id, item]));
  const next: CharacterActiveCondition[] = [];

  for (const entry of input.current) {
    const catalog = catalogById.get(entry.conditionId);
    const delta = recoveryDelta(catalog?.recovery, input.restType, input.restRules);
    if (delta === 0) {
      next.push(entry);
      continue;
    }

    const maxLevel = maxConditionLevel(catalog?.levels);
    const currentLevel = entry.level ?? 1;
    const nextLevel = currentLevel + delta;
    if (nextLevel < 1) continue;
    if (maxLevel === 0) {
      next.push(entry);
      continue;
    }
    next.push({
      conditionId: entry.conditionId,
      level: Math.min(maxLevel, nextLevel),
    });
  }

  return next;
}

function recoveryDelta(
  recovery: ConditionRecovery[] | undefined,
  restType: string,
  restRules?: SystemRestRules
): number {
  let total = 0;
  for (const entry of recovery ?? []) {
    if (restKindCovers(restRules, restType, entry.restKey)) {
      total += entry.delta;
    }
  }
  return total;
}

function upsertCondition(
  current: CharacterActiveCondition[],
  conditionId: string,
  level: number
): CharacterActiveCondition[] {
  const next = current.filter((item) => item.conditionId !== conditionId);
  next.push({ conditionId, level });
  return next;
}
