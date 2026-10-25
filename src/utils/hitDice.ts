import { HitPointHitDiceMode, HitPointHpMode } from "../domain/types/system.types";
import {
  CharacterHitDiceApi,
  CharacterHitDiceSpent,
  TypeHitDiceSpend,
} from "../domain/types/character.types";

export interface HitDiceClassPool {
  classId: string;
  level: number;
  hitDie: number;
}

export function normalizeHitDiceSpent(
  raw: unknown,
  classIds: string[]
): CharacterHitDiceSpent[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set(classIds.filter(Boolean));
  const byClass = new Map<string, number>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const classId = (item as { classId?: unknown }).classId;
    const spent = (item as { spent?: unknown }).spent;
    if (typeof classId !== "string" || !allowed.has(classId)) continue;
    if (typeof spent !== "number" || !Number.isInteger(spent) || spent < 0) continue;
    byClass.set(classId, Math.max(byClass.get(classId) ?? 0, spent));
  }

  return [...byClass.entries()]
    .filter(([, spent]) => spent > 0)
    .map(([classId, spent]) => ({ classId, spent }));
}

export function classPoolsFromCharacter(
  classes: Array<{ class?: string; classId?: string; level?: number; hitDie?: number | string; hit_die?: number | string }>
): HitDiceClassPool[] {
  return classes
    .map((entry) => {
      const classId = entry.classId ?? entry.class ?? "";
      const level = Number(entry.level);
      const hitDie = Number(entry.hitDie ?? entry.hit_die);
      return {
        classId,
        level: Number.isInteger(level) && level > 0 ? level : 0,
        hitDie: Number.isInteger(hitDie) && hitDie > 0 ? hitDie : 0,
      };
    })
    .filter((entry) => entry.classId.length > 0 && entry.level > 0 && entry.hitDie > 0);
}

export function toHitDiceApi(
  pools: HitDiceClassPool[],
  spent: CharacterHitDiceSpent[],
  bonusPerDie = 0
): CharacterHitDiceApi[] {
  const spentByClass = new Map(spent.map((item) => [item.classId, item.spent]));
  return pools.map((pool) => {
    const used = Math.min(spentByClass.get(pool.classId) ?? 0, pool.level);
    return {
      classId: pool.classId,
      hitDie: pool.hitDie,
      total: pool.level,
      spent: used,
      remaining: pool.level - used,
      bonusPerDie,
    };
  });
}

export function maxHpFromHitDice(count: number, hitDie: number, bonusPerDie: number): number {
  return Math.max(0, count * (hitDie + bonusPerDie));
}

export function applySpendHitDice(input: {
  classId: string;
  count: number;
  hpGained: number;
  pools: HitDiceClassPool[];
  spent: CharacterHitDiceSpent[];
  hpActual: number;
  hpMax: number;
  bonusPerDie: number;
}): { ok: true; spent: CharacterHitDiceSpent[]; hpActual: number } | { ok: false; message: string } {
  if (!Number.isInteger(input.count) || input.count < 1) {
    return { ok: false, message: "Debe gastar al menos 1 dado de golpe" };
  }
  if (!Number.isInteger(input.hpGained) || input.hpGained < 0) {
    return { ok: false, message: "Los PG recuperados no pueden ser negativos" };
  }

  const pool = input.pools.find((item) => item.classId === input.classId);
  if (!pool) {
    return { ok: false, message: "El personaje no tiene esa clase" };
  }

  const currentSpent = input.spent.find((item) => item.classId === input.classId)?.spent ?? 0;
  const remaining = Math.max(0, pool.level - currentSpent);
  if (input.count > remaining) {
    return { ok: false, message: "No quedan dados de golpe de esta clase" };
  }

  const maxHp = maxHpFromHitDice(input.count, pool.hitDie, input.bonusPerDie);
  if (input.hpGained > maxHp) {
    return {
      ok: false,
      message: `Los PG recuperados (${input.hpGained}) no pueden superar ${maxHp}`,
    };
  }

  const nextSpent = upsertSpent(input.spent, input.classId, currentSpent + input.count);
  const hpActual = Math.min(input.hpMax, input.hpActual + input.hpGained);
  return { ok: true, spent: nextSpent, hpActual };
}

export function applyRestHitDiceSpends(input: {
  spends?: TypeHitDiceSpend[];
  allowed: boolean;
  pools: HitDiceClassPool[];
  spent: CharacterHitDiceSpent[];
  hpActual: number;
  hpMax: number;
  bonusPerDie: number;
}): { ok: true; spent: CharacterHitDiceSpent[]; hpActual: number } | { ok: false; message: string } {
  const spends = input.spends ?? [];
  if (spends.length === 0) {
    return { ok: true, spent: input.spent, hpActual: input.hpActual };
  }
  if (!input.allowed) {
    return { ok: false, message: "Este descanso no admite gastar dados de golpe" };
  }

  let spent = input.spent;
  let hpActual = input.hpActual;
  for (const spend of spends) {
    const result = applySpendHitDice({
      classId: spend.classId,
      count: spend.count,
      hpGained: spend.hpGained,
      pools: input.pools,
      spent,
      hpActual,
      hpMax: input.hpMax,
      bonusPerDie: input.bonusPerDie,
    });
    if (!result.ok) return result;
    spent = result.spent;
    hpActual = result.hpActual;
  }
  return { ok: true, spent, hpActual };
}

export function halfHitDiceRecovered(totalDice: number): number {
  if (totalDice <= 0) return 0;
  return Math.max(1, Math.floor(totalDice / 2));
}

export function applyHitPointRecovery(input: {
  hp: HitPointHpMode;
  hitDice: HitPointHitDiceMode;
  pools: HitDiceClassPool[];
  spent: CharacterHitDiceSpent[];
  hpActual: number;
  hpMax: number;
}): { spent: CharacterHitDiceSpent[]; hpActual: number } {
  const hpActual = input.hp === "full"
    ? input.hpMax
    : input.hpActual;

  if (input.hitDice === "none") {
    return { spent: input.spent, hpActual };
  }
  if (input.hitDice === "all") {
    return { spent: [], hpActual };
  }

  const total = input.pools.reduce((sum, pool) => sum + pool.level, 0);
  let remaining = halfHitDiceRecovered(total);
  const spentByClass = new Map(input.spent.map((item) => [item.classId, item.spent]));
  const next: CharacterHitDiceSpent[] = [];

  for (const pool of input.pools) {
    const current = spentByClass.get(pool.classId) ?? 0;
    const recovered = Math.min(current, remaining);
    remaining -= recovered;
    const nextSpent = current - recovered;
    if (nextSpent > 0) next.push({ classId: pool.classId, spent: nextSpent });
  }

  return { spent: next, hpActual };
}

function upsertSpent(
  spent: CharacterHitDiceSpent[],
  classId: string,
  nextSpent: number
): CharacterHitDiceSpent[] {
  const next = spent.filter((item) => item.classId !== classId);
  if (nextSpent > 0) next.push({ classId, spent: nextSpent });
  return next;
}
