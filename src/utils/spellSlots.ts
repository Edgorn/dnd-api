import { ClassSpellSlots } from "../domain/types/characterClass.types";
import { SpellSlotPool } from "../domain/types/system.types";
import {
  CharacterSpellSlotApi,
  CharacterSpellSlotSpent,
} from "../domain/types/personajes.types";

export interface SpellSlotPoolEntry {
  classId: string;
  pool: SpellSlotPool;
  level: number;
  total: number;
}

function spentKey(classId: string | undefined, pool: SpellSlotPool, level: number): string {
  return `${classId ?? ""}|${pool}|${level}`;
}

export function slotPoolsFromSources(
  sources: Array<{ class: string; slots?: ClassSpellSlots } | null | undefined>
): SpellSlotPoolEntry[] {
  const pools: SpellSlotPoolEntry[] = [];

  for (const source of sources) {
    if (!source?.class || !source.slots) continue;

    if (source.slots.fixedLevelSlots) {
      const { count, level } = source.slots.fixedLevelSlots;
      if (count > 0 && Number.isInteger(level) && level >= 1 && level <= 9) {
        pools.push({ classId: source.class, pool: "fixedLevel", level, total: count });
      }
      continue;
    }

    const table = source.slots.slots;
    if (!table) continue;
    for (const [key, count] of Object.entries(table)) {
      const level = Number(key);
      if (!Number.isInteger(level) || level < 1 || level > 9) continue;
      if (typeof count !== "number" || !Number.isInteger(count) || count <= 0) continue;
      pools.push({ classId: source.class, pool: "standard", level, total: count });
    }
  }

  return pools;
}

export function normalizeSpellSlotsSpent(
  raw: unknown,
  pools: SpellSlotPoolEntry[]
): CharacterSpellSlotSpent[] {
  if (!Array.isArray(raw)) return [];
  const totals = new Map(
    pools.map((pool) => [spentKey(pool.classId, pool.pool, pool.level), pool.total])
  );
  const byKey = new Map<string, CharacterSpellSlotSpent>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const classId = (item as { classId?: unknown }).classId;
    const pool = (item as { pool?: unknown }).pool;
    const level = (item as { level?: unknown }).level;
    const spent = (item as { spent?: unknown }).spent;
    if (pool !== "standard" && pool !== "fixedLevel") continue;
    if (typeof level !== "number" || !Number.isInteger(level) || level < 1 || level > 9) continue;
    if (typeof spent !== "number" || !Number.isInteger(spent) || spent < 0) continue;

    const resolvedClassId = typeof classId === "string" && classId.length > 0 ? classId : undefined;
    const key = spentKey(resolvedClassId, pool, level);
    const total = totals.get(key);
    if (total === undefined) continue;
    const clipped = Math.min(spent, total);
    if (clipped <= 0) continue;
    byKey.set(key, {
      ...(resolvedClassId ? { classId: resolvedClassId } : {}),
      pool,
      level,
      spent: Math.max(byKey.get(key)?.spent ?? 0, clipped),
    });
  }

  return [...byKey.values()];
}

export function toSpellSlotsApi(
  pools: SpellSlotPoolEntry[],
  spent: CharacterSpellSlotSpent[]
): CharacterSpellSlotApi[] {
  const spentByKey = new Map(
    spent.map((item) => [spentKey(item.classId, item.pool, item.level), item.spent])
  );
  return pools.map((pool) => {
    const used = Math.min(spentByKey.get(spentKey(pool.classId, pool.pool, pool.level)) ?? 0, pool.total);
    return {
      classId: pool.classId,
      pool: pool.pool,
      level: pool.level,
      total: pool.total,
      spent: used,
      remaining: pool.total - used,
    };
  });
}

export function applySpendSpellSlot(input: {
  classId: string;
  pool: SpellSlotPool;
  level: number;
  pools: SpellSlotPoolEntry[];
  spent: CharacterSpellSlotSpent[];
}): { ok: true; spent: CharacterSpellSlotSpent[] } | { ok: false; message: string } {
  const pool = input.pools.find(
    (item) => item.classId === input.classId && item.pool === input.pool && item.level === input.level
  );
  if (!pool) {
    return { ok: false, message: "El personaje no tiene esas ranuras" };
  }

  const current = input.spent.find(
    (item) => item.classId === input.classId && item.pool === input.pool && item.level === input.level
  )?.spent ?? 0;
  if (current >= pool.total) {
    return { ok: false, message: "No quedan ranuras de ese nivel" };
  }

  return { ok: true, spent: upsertSpent(input.spent, input.classId, input.pool, input.level, current + 1) };
}

export function applySpellSlotRecovery(
  spent: CharacterSpellSlotSpent[],
  recoveredPools: SpellSlotPool[]
): CharacterSpellSlotSpent[] {
  if (recoveredPools.length === 0) return spent;
  const recovered = new Set(recoveredPools);
  return spent.filter((item) => !recovered.has(item.pool));
}

export function applyRecoverClassSpellSlots(
  spent: CharacterSpellSlotSpent[],
  input: { classId: string; pool: SpellSlotPool }
): CharacterSpellSlotSpent[] {
  return spent.filter(
    (item) => !(item.classId === input.classId && item.pool === input.pool)
  );
}

function upsertSpent(
  spent: CharacterSpellSlotSpent[],
  classId: string,
  pool: SpellSlotPool,
  level: number,
  nextSpent: number
): CharacterSpellSlotSpent[] {
  const next = spent.filter(
    (item) => !(item.classId === classId && item.pool === pool && item.level === level)
  );
  if (nextSpent > 0) next.push({ classId, pool, level, spent: nextSpent });
  return next;
}
