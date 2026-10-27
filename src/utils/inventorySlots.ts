import { EquipSlot, MountGearSlot } from "../domain/types/equipment.types";
import { CharacterEquipmentMongo } from "../domain/types/character.types";
import { cloneInventory, sameHolder } from "./inventoryStacks";

export type InventorySlotLookup = (
  item: CharacterEquipmentMongo
) => EquipSlot | null | undefined;

export function occupiedSlotsFor(equipSlot: EquipSlot): EquipSlot[] {
  if (equipSlot === "two_handed") return ["main_hand", "off_hand"];
  return [equipSlot];
}

export function slotCapacity(slot: EquipSlot): number {
  return slot === "ring" ? 2 : 1;
}

export function applyEquip(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  equipped: boolean,
  slotOf: InventorySlotLookup
): CharacterEquipmentMongo[] {
  const result = cloneInventory(inventory);
  const targetIdx = result.findIndex(item => item.instanceId === instanceId);
  if (targetIdx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  if (!equipped) {
    result[targetIdx] = { ...result[targetIdx], equipped: false };
    return result;
  }

  const targetSlot = slotOf(result[targetIdx]);
  if (!targetSlot) {
    throw new Error("NO_EQUIP_SLOT");
  }

  const targetHolder = result[targetIdx].holderId;
  const occupies = (item: CharacterEquipmentMongo, slot: EquipSlot): boolean => {
    if (!item.equipped) return false;
    if (!sameHolder(item.holderId, targetHolder)) return false;
    const itemSlot = slotOf(item);
    if (!itemSlot) return false;
    return occupiedSlotsFor(itemSlot).includes(slot);
  };

  for (const slot of occupiedSlotsFor(targetSlot)) {
    const cap = slotCapacity(slot);
    while (true) {
      const occupants = result.filter((item, index) => index !== targetIdx && occupies(item, slot));
      if (occupants.length + 1 <= cap) break;
      const first = occupants[0];
      const idx = result.findIndex(item => item.instanceId === first.instanceId);
      result[idx] = { ...result[idx], equipped: false };
    }
  }

  result[targetIdx] = { ...result[targetIdx], equipped: true };
  return result;
}

export type MountGearSlotLookup = (
  item: CharacterEquipmentMongo
) => MountGearSlot | null | undefined;

export function applyMountGear(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  equipped: boolean,
  slotOf: MountGearSlotLookup
): CharacterEquipmentMongo[] {
  const result = cloneInventory(inventory);
  const targetIdx = result.findIndex(item => item.instanceId === instanceId);
  if (targetIdx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  if (!equipped) {
    result[targetIdx] = { ...result[targetIdx], equipped: false };
    return result;
  }

  const targetSlot = slotOf(result[targetIdx]);
  if (!targetSlot) {
    throw new Error("NO_MOUNT_GEAR_SLOT");
  }

  const targetHolder = result[targetIdx].holderId;
  for (let i = 0; i < result.length; i++) {
    if (i === targetIdx) continue;
    const item = result[i];
    if (!item.equipped) continue;
    if (!sameHolder(item.holderId, targetHolder)) continue;
    if (slotOf(item) !== targetSlot) continue;
    result[i] = { ...item, equipped: false };
  }

  result[targetIdx] = { ...result[targetIdx], equipped: true };
  return result;
}
