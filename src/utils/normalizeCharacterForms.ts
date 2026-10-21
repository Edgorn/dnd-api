import { Types } from "mongoose";
import {
  CharacterFormMongo,
  CREATURE_FORM_PURPOSES,
  CreatureFormPurpose
} from "../domain/types/creatureForm.types";

export const MAX_CHARACTER_FORMS = 20;

function isPurpose(value: unknown): value is CreatureFormPurpose {
  return (CREATURE_FORM_PURPOSES as readonly string[]).includes(value as string);
}

function resolveFormId(id: unknown, fallback: string): string {
  if (typeof id === "string" && Types.ObjectId.isValid(id)) {
    return id;
  }
  if (Types.ObjectId.isValid(fallback)) {
    return fallback;
  }
  return new Types.ObjectId().toString();
}

export function normalizeCharacterForms(raw: unknown): CharacterFormMongo[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }

  const result: CharacterFormMongo[] = [];

  for (const item of raw) {
    if (result.length >= MAX_CHARACTER_FORMS) break;

    if (typeof item === "string" && item.trim()) {
      const creatureId = item.trim();
      result.push({
        id: resolveFormId(undefined, creatureId),
        creatureId
      });
      continue;
    }

    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const creatureId = typeof row.creatureId === "string" ? row.creatureId.trim() : "";
    if (!creatureId) continue;

    const form: CharacterFormMongo = {
      id: resolveFormId(row.id, creatureId),
      creatureId
    };
    if (typeof row.spellId === "string" && row.spellId.trim()) {
      form.spellId = row.spellId.trim();
    }
    if (isPurpose(row.purpose)) {
      form.purpose = row.purpose;
    }
    result.push(form);
  }

  return result;
}
