import { Types } from "mongoose";
import {
  CharacterCompanion,
  CharacterCompanionInput,
  CompanionKind,
  CompanionSource,
  COMPANION_KINDS,
  COMPANION_SOURCES,
  DEFAULT_COMPANION_KIND,
} from "../domain/types/character.types";

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

function isCompanionKind(value: unknown): value is CompanionKind {
  return typeof value === "string" && (COMPANION_KINDS as readonly string[]).includes(value);
}

function isCompanionSource(value: unknown): value is CompanionSource {
  return typeof value === "string" && (COMPANION_SOURCES as readonly string[]).includes(value);
}

function normalizeConditions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((item): item is string => typeof item === "string" && Types.ObjectId.isValid(item));
  return ids.length > 0 ? [...new Set(ids)] : undefined;
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

    const kind = isCompanionKind(raw.kind) ? raw.kind : DEFAULT_COMPANION_KIND;
    const companion: CharacterCompanion = {
      id: resolveCompanionId(raw.id),
      name,
      kind,
    };

    const role = trimOptional(raw.role);
    const notes = trimOptional(raw.notes);
    const sourceTraitId = trimOptional(raw.sourceTraitId);
    const creatureId = trimOptional(raw.creatureId);
    const source = isCompanionSource(raw.source) ? raw.source : undefined;
    const conditions = normalizeConditions(raw.conditions);

    if (role) companion.role = role;
    if (notes) companion.notes = notes;
    if (sourceTraitId) companion.sourceTraitId = sourceTraitId;
    if (creatureId && Types.ObjectId.isValid(creatureId)) companion.creatureId = creatureId;
    if (source) companion.source = source;
    if (conditions) companion.conditions = conditions;

    if (typeof raw.hpCurrent === "number" && Number.isFinite(raw.hpCurrent)) {
      companion.hpCurrent = Math.max(0, Math.floor(raw.hpCurrent));
    }

    result.push(companion);
  }

  return result;
}

export function mergeCompanionsOnReplace(
  incoming: CharacterCompanionInput[] | undefined | null,
  existing: CharacterCompanion[] | undefined | null
): CharacterCompanion[] {
  const previousById = new Map(normalizeCompanions(existing).map(item => [item.id, item]));
  const incomingNormalized = normalizeCompanions(incoming);

  const merged = incomingNormalized.map(companion => {
    const previous = previousById.get(companion.id);
    if (!previous) return companion;

    const next: CharacterCompanion = { ...companion };
    if (previous.creatureId !== undefined) next.creatureId = previous.creatureId;
    if (previous.hpCurrent !== undefined) next.hpCurrent = previous.hpCurrent;
    if (previous.conditions !== undefined) next.conditions = [...previous.conditions];
    return next;
  });

  return normalizeCompanions(merged);
}

export function clipCompanionHp(hpCurrent: number, hpMax?: number): number {
  const floored = Math.max(0, Math.floor(hpCurrent));
  if (hpMax === undefined) return floored;
  return Math.min(floored, Math.max(0, Math.floor(hpMax)));
}

export type CompanionRemovalConflict = "heldItems" | "vehicleDraft";

export function companionRemovalConflict(
  inventory: ReadonlyArray<unknown>,
  companionId: string
): CompanionRemovalConflict | null {
  for (const row of inventory) {
    if (!row || typeof row !== "object") continue;
    const item = row as { holderId?: string | null; drawnBy?: unknown };
    if (item.holderId === companionId) return "heldItems";
    if (Array.isArray(item.drawnBy) && item.drawnBy.includes(companionId)) return "vehicleDraft";
  }
  return null;
}

export function companionRemovalConflictMessage(conflict: CompanionRemovalConflict): string {
  if (conflict === "heldItems") {
    return "El compañero transporta equipo; muévalo antes de eliminarlo";
  }
  return "El compañero tira de un vehículo; desengánchelo antes de eliminarlo";
}
