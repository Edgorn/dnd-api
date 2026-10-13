import { CharacterTraitResource } from "../domain/types/personajes.types";

export function normalizeTraitResources(raw: unknown): CharacterTraitResource[] {
  if (!Array.isArray(raw)) return [];
  const result: CharacterTraitResource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const traitId = (item as { traitId?: unknown }).traitId;
    const spent = (item as { spent?: unknown }).spent;
    if (typeof traitId !== "string" || traitId.length === 0) continue;
    if (typeof spent !== "number" || !Number.isInteger(spent) || spent < 0) continue;
    result.push({ traitId, spent });
  }
  return result;
}

export function normalizeActiveTraitIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || id.length === 0 || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}
