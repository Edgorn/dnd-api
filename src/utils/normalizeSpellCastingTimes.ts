import { CastingTime } from "../domain/types/spell.types";

export interface SpellCastingTimeFields {
  castingTimes?: CastingTime[] | null;
  castingTime?: CastingTime | null;
}

function mapCastingTime(entry: CastingTime): CastingTime {
  return {
    value: entry.value,
    unit: entry.unit,
    ...(entry.condition !== undefined ? { condition: entry.condition } : {})
  };
}

function isCastingTime(value: unknown): value is CastingTime {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const entry = value as CastingTime;
  return typeof entry.unit === "string" && entry.unit.length > 0;
}

export function normalizeSpellCastingTimes(
  spell: SpellCastingTimeFields
): CastingTime[] | undefined {
  if (Array.isArray(spell.castingTimes) && spell.castingTimes.length > 0) {
    const mapped = spell.castingTimes.filter(isCastingTime).map(mapCastingTime);
    if (mapped.length > 0) {
      return mapped;
    }
  }

  if (isCastingTime(spell.castingTime)) {
    return [mapCastingTime(spell.castingTime)];
  }

  return undefined;
}
