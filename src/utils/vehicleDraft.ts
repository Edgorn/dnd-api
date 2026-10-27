import { CharacterCompanion, CharacterEquipmentMongo } from "../domain/types/character.types";
import { cloneInventory } from "./inventoryStacks";

export const DRAFTABLE_COMPANION_KINDS = ["mount", "animal"] as const;

export function uniqueCompanionIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function isCompanionHitched(
  inventory: ReadonlyArray<Pick<CharacterEquipmentMongo, "instanceId" | "drawnBy">>,
  companionId: string,
  exceptInstanceId?: string
): boolean {
  return inventory.some(row =>
    row.instanceId !== exceptInstanceId
    && Array.isArray(row.drawnBy)
    && row.drawnBy.includes(companionId)
  );
}

export function isDraftableCompanion(companion: CharacterCompanion): boolean {
  const kind = companion.kind ?? "narrative";
  return (DRAFTABLE_COMPANION_KINDS as readonly string[]).includes(kind)
    && Boolean(companion.creatureId);
}

export function setVehicleDrawnBy(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  companionIds: string[]
): CharacterEquipmentMongo[] {
  const result = cloneInventory(inventory);
  const idx = result.findIndex(item => item.instanceId === instanceId);
  if (idx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  result[idx] = {
    ...result[idx],
    drawnBy: uniqueCompanionIds(companionIds),
  };
  return result;
}
