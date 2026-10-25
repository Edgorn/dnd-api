import { CharacterMongo } from "../domain/types/character.types";

type LooseRecord = Record<string, unknown>;

function asRecord(value: unknown): LooseRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as LooseRecord;
}

function pickNumber(primary: unknown, fallback: unknown): number | undefined {
  if (typeof primary === "number" && Number.isFinite(primary)) return primary;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  if (typeof fallback === "string" && fallback.trim() !== "") {
    const parsed = Number(fallback);
    if (Number.isFinite(parsed)) return parsed;
  }
  return typeof primary === "number" ? primary : undefined;
}

function normalizeClasses(raw: unknown): CharacterMongo["classes"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((row) => {
    const entry = asRecord(row) ?? {};
    const hitDie = pickNumber(entry.hitDie, entry.hit_die) ?? 0;
    return {
      class: typeof entry.class === "string" ? entry.class : "",
      name: typeof entry.name === "string" ? entry.name : "",
      level: pickNumber(entry.level, undefined) ?? 0,
      hitDie,
    };
  });
}

function toPlain(raw: unknown): unknown {
  if (raw && typeof raw === "object" && typeof (raw as { toObject?: unknown }).toObject === "function") {
    return (raw as { toObject: () => unknown }).toObject();
  }
  return raw;
}

export function normalizeCharacterDocument(raw: unknown): CharacterMongo {
  const source = asRecord(toPlain(raw)) ?? {};
  const classes = normalizeClasses(source.classes) ?? [];

  return {
    ...(source as unknown as CharacterMongo),
    classes,
    savingThrows: (source.savingThrows as string[] | undefined)
      ?? (source.saving_throws as string[] | undefined)
      ?? [],
    traitsData: (source.traitsData as CharacterMongo["traitsData"])
      ?? (source.traits_data as CharacterMongo["traitsData"])
      ?? {},
    proficiencyBonus: pickNumber(source.proficiencyBonus, source.prof_bonus) ?? 0,
    weaponProficiencies: (source.weaponProficiencies as string[] | undefined)
      ?? (source.proficiency_weapon as string[] | undefined)
      ?? [],
    armorProficiencies: (source.armorProficiencies as string[] | undefined)
      ?? (source.proficiency_armor as string[] | undefined)
      ?? [],
    hpMax: pickNumber(source.hpMax, source.HPMax) ?? 0,
    hpCurrent: pickNumber(source.hpCurrent, source.HPActual) ?? 0,
    xp: pickNumber(source.xp, source.XP) ?? 0,
  };
}
