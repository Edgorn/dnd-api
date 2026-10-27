import { Types } from "mongoose";
import { CharacterEquipmentMongo } from "../domain/types/character.types";
import { customizationStackKey } from "./grantedEquipment";

export function createInstanceId(): string {
  return new Types.ObjectId().toString();
}

function instanceExtras(
  item: Pick<CharacterEquipmentMongo, "holderId" | "drawnBy" | "hpCurrent">
): Pick<CharacterEquipmentMongo, "holderId" | "drawnBy" | "hpCurrent"> {
  return {
    ...(item.holderId ? { holderId: item.holderId } : {}),
    ...(item.drawnBy !== undefined ? { drawnBy: [...item.drawnBy] } : {}),
    ...(item.hpCurrent !== undefined ? { hpCurrent: item.hpCurrent } : {}),
  };
}

function hasUnstackableInstanceState(
  item: Pick<CharacterEquipmentMongo, "drawnBy" | "hpCurrent">
): boolean {
  return item.hpCurrent !== undefined || item.drawnBy !== undefined;
}

export function createInventoryInstance(input: {
  equipmentId: string;
  quantity: number;
  isMagic: boolean;
  equipped?: boolean;
  isBond?: boolean;
  isFavorite?: boolean;
  bondOrigin?: CharacterEquipmentMongo["bondOrigin"];
  bondStored?: boolean;
  uniqueGranted?: boolean;
  customization?: CharacterEquipmentMongo["customization"];
  holderId?: string | null;
  drawnBy?: string[];
  hpCurrent?: number;
}): CharacterEquipmentMongo {
  return {
    instanceId: createInstanceId(),
    equipmentId: input.equipmentId,
    quantity: input.quantity,
    isMagic: input.isMagic,
    equipped: input.equipped ?? false,
    isBond: input.isBond ?? false,
    isFavorite: input.isFavorite ?? false,
    ...(input.bondOrigin ? { bondOrigin: input.bondOrigin } : {}),
    ...(input.bondStored ? { bondStored: true } : {}),
    ...(input.uniqueGranted ? { uniqueGranted: true } : {}),
    ...(input.customization ? { customization: input.customization } : {}),
    ...instanceExtras(input),
  };
}

export function cloneInventory(
  inventory: CharacterEquipmentMongo[]
): CharacterEquipmentMongo[] {
  return inventory.map(item => ({
    instanceId: item.instanceId,
    equipmentId: item.equipmentId,
    quantity: item.quantity,
    equipped: item.equipped,
    isMagic: item.isMagic,
    isBond: item.isBond,
    isFavorite: item.isFavorite,
    ...(item.bondOrigin ? { bondOrigin: item.bondOrigin } : {}),
    ...(item.bondStored ? { bondStored: true } : {}),
    ...(item.uniqueGranted ? { uniqueGranted: true } : {}),
    ...(item.customization ? { customization: item.customization } : {}),
    ...instanceExtras(item),
  }));
}

export function sameHolder(
  a?: string | null,
  b?: string | null
): boolean {
  return (a ?? null) === (b ?? null);
}

export function canStackWith(
  a: CharacterEquipmentMongo,
  b: Pick<CharacterEquipmentMongo, "equipmentId" | "isMagic" | "isBond" | "equipped" | "isFavorite" | "uniqueGranted" | "customization" | "holderId" | "drawnBy" | "hpCurrent">
): boolean {
  if (a.uniqueGranted || b.uniqueGranted) return false;
  if (a.isBond || b.isBond) return false;
  if (a.equipped || b.equipped) return false;
  if (a.isFavorite || b.isFavorite) return false;
  if (hasUnstackableInstanceState(a) || hasUnstackableInstanceState(b)) return false;
  if (!sameHolder(a.holderId, b.holderId)) return false;
  return a.equipmentId === b.equipmentId
    && a.isMagic === b.isMagic
    && customizationStackKey(a.customization) === customizationStackKey(b.customization);
}

export function addToInventory(
  inventory: CharacterEquipmentMongo[],
  incoming: CharacterEquipmentMongo
): CharacterEquipmentMongo[] {
  const result = cloneInventory(inventory);
  const idx = result.findIndex(item => canStackWith(item, incoming));

  if (idx > -1) {
    result[idx] = {
      ...result[idx],
      quantity: result[idx].quantity + incoming.quantity,
    };
    return result;
  }

  return [...result, incoming];
}

export function splitOne(
  inventory: CharacterEquipmentMongo[],
  instanceId: string
): { inventory: CharacterEquipmentMongo[]; instance: CharacterEquipmentMongo } {
  const result = cloneInventory(inventory);
  const idx = result.findIndex(item => item.instanceId === instanceId);
  if (idx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  const item = result[idx];
  if (item.quantity <= 1) {
    return { inventory: result, instance: item };
  }

  result[idx] = { ...item, quantity: item.quantity - 1 };
  const split = createInventoryInstance({
    equipmentId: item.equipmentId,
    quantity: 1,
    isMagic: item.isMagic,
    holderId: item.holderId,
    ...(item.customization ? { customization: item.customization } : {}),
    ...(item.hpCurrent !== undefined ? { hpCurrent: item.hpCurrent } : {}),
  });
  result.push(split);

  return { inventory: result, instance: split };
}

export function splitQuantity(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  quantity: number
): { inventory: CharacterEquipmentMongo[]; instance: CharacterEquipmentMongo } {
  const result = cloneInventory(inventory);
  const idx = result.findIndex(item => item.instanceId === instanceId);
  if (idx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  const item = result[idx];
  if (quantity < 1 || quantity > item.quantity) {
    throw new Error("QUANTITY_EXCEEDS_STACK");
  }
  if (quantity === item.quantity) {
    return { inventory: result, instance: item };
  }

  result[idx] = { ...item, quantity: item.quantity - quantity };
  const split = createInventoryInstance({
    equipmentId: item.equipmentId,
    quantity,
    isMagic: item.isMagic,
    holderId: item.holderId,
    ...(item.hpCurrent !== undefined ? { hpCurrent: item.hpCurrent } : {}),
  });
  result.push(split);

  return { inventory: result, instance: split };
}

export function tryMerge(
  inventory: CharacterEquipmentMongo[],
  instanceId: string
): CharacterEquipmentMongo[] {
  const result = cloneInventory(inventory);
  const idx = result.findIndex(item => item.instanceId === instanceId);
  if (idx === -1) return result;

  const item = result[idx];
  if (item.isBond || item.equipped || item.isFavorite) return result;

  const otherIdx = result.findIndex((other, i) => i !== idx && canStackWith(other, item));
  if (otherIdx === -1) return result;

  result[otherIdx] = {
    ...result[otherIdx],
    quantity: result[otherIdx].quantity + item.quantity,
  };
  result.splice(idx, 1);
  return result;
}

export function removeOrDecrement(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  quantity?: number
): CharacterEquipmentMongo[] {
  const result = cloneInventory(inventory);
  const idx = result.findIndex(item => item.instanceId === instanceId);
  if (idx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  const item = result[idx];
  if (quantity !== undefined && quantity < item.quantity) {
    result[idx] = { ...item, quantity: item.quantity - quantity };
    return result;
  }

  result.splice(idx, 1);
  return result;
}
