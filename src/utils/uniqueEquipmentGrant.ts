import { CharacterEquipmentMongo } from "../domain/types/character.types";
import {
  TraitUniqueEquipmentGrant,
  TraitUniqueEquipmentGrantApi
} from "../domain/types/traits.types";
import { cloneInventory } from "./inventoryStacks";

export function hydrateUniqueEquipmentGrant(
  grant: TraitUniqueEquipmentGrant | null | undefined,
  equipmentById: Map<string, { id: string; name: string }>
): TraitUniqueEquipmentGrantApi | undefined {
  if (!grant || typeof grant !== "object") return undefined;
  if (typeof grant.equipmentId !== "string" || !grant.equipmentId) return undefined;
  const item = equipmentById.get(grant.equipmentId);
  if (!item) return undefined;
  return { id: item.id, name: item.name };
}

export function ownedUniqueEquipmentGrant(
  traits: Array<{ uniqueEquipmentGrant?: TraitUniqueEquipmentGrantApi | null }>
): string | undefined {
  return traits.find(trait => trait.uniqueEquipmentGrant)?.uniqueEquipmentGrant?.id;
}

export function hasUniqueGranted(inventory: CharacterEquipmentMongo[]): boolean {
  return inventory.some(item => item.uniqueGranted === true);
}

export function applyGrantUniqueEquipment(
  inventory: CharacterEquipmentMongo[],
  instance: CharacterEquipmentMongo
): CharacterEquipmentMongo[] {
  if (hasUniqueGranted(inventory)) return cloneInventory(inventory);
  return [...cloneInventory(inventory), { ...instance, uniqueGranted: true, quantity: 1 }];
}

export function applyReplaceUniqueEquipment(
  inventory: CharacterEquipmentMongo[],
  instance: CharacterEquipmentMongo
): CharacterEquipmentMongo[] {
  return [
    ...cloneInventory(inventory).filter(item => item.uniqueGranted !== true),
    { ...instance, uniqueGranted: true, quantity: 1 }
  ];
}

export function clearUniqueGrantedOnTraitLost(
  inventory: CharacterEquipmentMongo[]
): CharacterEquipmentMongo[] {
  return cloneInventory(inventory).filter(item => item.uniqueGranted !== true);
}
