export type CharacterFieldMigration = {
  $set: Record<string, unknown>;
  $unset: Record<string, "">;
};

const ROOT_RENAMES: Array<[legacy: string, next: string]> = [
  ["HPMax", "hpMax"],
  ["HPActual", "hpCurrent"],
  ["XP", "xp"],
  ["traits_data", "traitsData"],
  ["prof_bonus", "proficiencyBonus"],
  ["saving_throws", "savingThrows"],
  ["proficiency_weapon", "weaponProficiencies"],
  ["proficiency_armor", "armorProficiencies"],
];

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toHitDie(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function migrateClasses(raw: unknown): unknown[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  let changed = false;
  const next = raw.map((row) => {
    const entry = asRecord(row);
    if (!entry || !Object.prototype.hasOwnProperty.call(entry, "hit_die")) {
      return row;
    }

    changed = true;
    const { hit_die: legacyHitDie, ...rest } = entry;
    const hitDie = toHitDie(rest.hitDie) ?? toHitDie(legacyHitDie) ?? 0;
    return { ...rest, hitDie };
  });

  return changed ? next : undefined;
}

export function migrateCharacterDocumentFields(raw: unknown): CharacterFieldMigration | null {
  const source = asRecord(raw);
  if (!source) return null;

  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};

  for (const [legacy, next] of ROOT_RENAMES) {
    if (!Object.prototype.hasOwnProperty.call(source, legacy)) continue;
    if (!Object.prototype.hasOwnProperty.call(source, next)) {
      $set[next] = source[legacy];
    }
    $unset[legacy] = "";
  }

  const classes = migrateClasses(source.classes);
  if (classes) {
    $set.classes = classes;
  }

  if (Object.keys($set).length === 0 && Object.keys($unset).length === 0) {
    return null;
  }

  return { $set, $unset };
}
