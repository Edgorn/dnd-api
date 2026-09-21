import { Types } from "mongoose";
import {
  CharacterCompanion,
  CharacterCompanionInput,
} from "../domain/types/personajes.types";

export const MAX_CHARACTER_COMPANIONS = 20;

function trimOptional(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveCompanionId(id?: string): string {
  if (id && Types.ObjectId.isValid(id)) {
    return id;
  }
  return new Types.ObjectId().toString();
}

export function normalizeCompanions(
  input: CharacterCompanionInput[] | undefined | null
): CharacterCompanion[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [];
  }

  const result: CharacterCompanion[] = [];

  for (const raw of input) {
    if (result.length >= MAX_CHARACTER_COMPANIONS) {
      break;
    }

    const name = raw?.name?.trim();
    if (!name) {
      continue;
    }

    const companion: CharacterCompanion = {
      id: resolveCompanionId(raw.id),
      name,
    };

    const role = trimOptional(raw.role);
    const notes = trimOptional(raw.notes);
    const sourceTraitId = trimOptional(raw.sourceTraitId);

    if (role) companion.role = role;
    if (notes) companion.notes = notes;
    if (sourceTraitId) companion.sourceTraitId = sourceTraitId;

    result.push(companion);
  }

  return result;
}
