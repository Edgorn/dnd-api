import { Types } from "mongoose";
import { PersonajeEquipmentMongo } from "../domain/types/personajes.types";

export function createInstanceId(): string {
  return new Types.ObjectId().toString();
}

export function createInventoryInstance(input: {
  equipmentId: string;
  quantity: number;
  isMagic: boolean;
  equipped?: boolean;
  isBond?: boolean;
  isFavorite?: boolean;
}): PersonajeEquipmentMongo {
  return {
    instanceId: createInstanceId(),
    equipmentId: input.equipmentId,
    quantity: input.quantity,
    isMagic: input.isMagic,
    equipped: input.equipped ?? false,
    isBond: input.isBond ?? false,
    isFavorite: input.isFavorite ?? false,
  };
}

export function cloneInventory(
  inventory: PersonajeEquipmentMongo[]
): PersonajeEquipmentMongo[] {
  return inventory.map(item => ({
    instanceId: item.instanceId,
    equipmentId: item.equipmentId,
    quantity: item.quantity,
    equipped: item.equipped,
    isMagic: item.isMagic,
    isBond: item.isBond,
    isFavorite: item.isFavorite,
  }));
}

export function canStackWith(
  a: PersonajeEquipmentMongo,
  b: Pick<PersonajeEquipmentMongo, "equipmentId" | "isMagic" | "isBond" | "equipped" | "isFavorite">
): boolean {
  if (a.isBond || b.isBond) return false;
  if (a.equipped || b.equipped) return false;
  if (a.isFavorite || b.isFavorite) return false;
  return a.equipmentId === b.equipmentId && a.isMagic === b.isMagic;
}

export function addToInventory(
  inventory: PersonajeEquipmentMongo[],
  incoming: PersonajeEquipmentMongo
): PersonajeEquipmentMongo[] {
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
  inventory: PersonajeEquipmentMongo[],
  instanceId: string
): { inventory: PersonajeEquipmentMongo[]; instance: PersonajeEquipmentMongo } {
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
  });
  result.push(split);

  return { inventory: result, instance: split };
}

export function tryMerge(
  inventory: PersonajeEquipmentMongo[],
  instanceId: string
): PersonajeEquipmentMongo[] {
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
  inventory: PersonajeEquipmentMongo[],
  instanceId: string,
  quantity?: number
): PersonajeEquipmentMongo[] {
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
