import {
  CharacterCompanionApi,
  CharacterEquipmentMongo,
} from "../domain/types/character.types";
import { CharacterEquipmentApi, MountGearSlot } from "../domain/types/equipment.types";
import { sizeMeetsMinimum } from "../domain/types/size.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import { drawCapacity } from "./carryingCapacity";
import { cloneInventory, sameHolder, splitQuantity, tryMerge } from "./inventoryStacks";

export type HolderCatalogEntry = {
  vehicle?: unknown;
  containerStats?: unknown;
};

export type BardingRules = Pick<
  SystemRulesConfig,
  "bardingCostMultiplier" | "bardingWeightMultiplier"
> | null | undefined;

export type HolderStateRules = Pick<
  SystemRulesConfig,
  "bardingCostMultiplier" | "bardingWeightMultiplier" | "drawCapacityMultiplier"
> | null | undefined;

function descendantInstanceIds(
  inventory: CharacterEquipmentMongo[],
  instanceId: string
): Set<string> {
  const result = new Set<string>();
  const queue = [instanceId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    for (const row of inventory) {
      if (row.holderId !== current || result.has(row.instanceId)) continue;
      result.add(row.instanceId);
      queue.push(row.instanceId);
    }
  }
  return result;
}

export function isKnownHolder(
  holderId: string | null,
  inventory: CharacterEquipmentMongo[],
  companionIds: Iterable<string>,
  catalogByEquipmentId: Map<string, HolderCatalogEntry>
): boolean {
  if (holderId === null) return true;
  for (const id of companionIds) {
    if (id === holderId) return true;
  }
  const row = inventory.find(item => item.instanceId === holderId);
  if (!row) return false;
  const catalog = catalogByEquipmentId.get(row.equipmentId);
  return Boolean(catalog?.vehicle || catalog?.containerStats);
}

export function wouldCreateHolderCycle(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  holderId: string | null
): boolean {
  if (holderId === null) return false;
  if (holderId === instanceId) return true;
  return descendantInstanceIds(inventory, instanceId).has(holderId);
}

export function holderHasContents(
  inventory: ReadonlyArray<{ holderId?: string | null }>,
  holderId: string
): boolean {
  return inventory.some(row => row.holderId === holderId);
}

export function moveInventoryRows(
  inventory: CharacterEquipmentMongo[],
  instanceId: string,
  holderId: string | null,
  quantity?: number
): CharacterEquipmentMongo[] {
  if (wouldCreateHolderCycle(inventory, instanceId, holderId)) {
    throw new Error("HOLDER_CYCLE");
  }

  const source = inventory.find(item => item.instanceId === instanceId);
  if (!source) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  const amount = quantity ?? source.quantity;
  const { inventory: splitInventory, instance } = splitQuantity(inventory, instanceId, amount);
  const result = cloneInventory(splitInventory);
  const idx = result.findIndex(item => item.instanceId === instance.instanceId);
  if (idx === -1) {
    throw new Error("INVENTORY_INSTANCE_NOT_FOUND");
  }

  const nextHolder = holderId ?? undefined;
  const holderChanged = !sameHolder(result[idx].holderId, nextHolder);
  result[idx] = {
    ...result[idx],
    ...(nextHolder ? { holderId: nextHolder } : {}),
    ...(holderChanged ? { equipped: false } : {}),
  };
  if (!nextHolder) {
    delete result[idx].holderId;
  }

  return tryMerge(result, result[idx].instanceId);
}

function hasBardingMultipliers(
  rules: BardingRules
): rules is { bardingCostMultiplier: number; bardingWeightMultiplier: number } {
  return rules?.bardingCostMultiplier !== undefined
    && rules?.bardingWeightMultiplier !== undefined;
}

export function applyBardingPricing(
  equipment: CharacterEquipmentApi[],
  mountIds: Set<string>,
  rules: BardingRules
): CharacterEquipmentApi[] {
  if (!hasBardingMultipliers(rules)) return equipment;

  return equipment.map(item => {
    if (!item.equipped) return item;
    if (!item.holderId || !mountIds.has(item.holderId)) return item;
    if (item.mountGear?.slot !== "barding") return item;

    return {
      ...item,
      weight: item.weight * rules.bardingWeightMultiplier,
      cost: {
        ...item.cost,
        quantity: item.cost.quantity * rules.bardingCostMultiplier,
      },
    };
  });
}

function itemWeight(item: Pick<CharacterEquipmentApi, "weight" | "quantity">): number {
  return (item.weight ?? 0) * (item.quantity ?? 1);
}

export function loadByHolder(
  equipment: CharacterEquipmentApi[],
  holderId: string | null,
  options?: { excludeVehicles?: boolean }
): number {
  let total = 0;
  for (const item of equipment) {
    if (!sameHolder(item.holderId, holderId)) continue;
    if (options?.excludeVehicles && item.vehicle) continue;
    total += itemWeight(item);
    if (item.instanceId) {
      total += loadByHolder(equipment, item.instanceId);
    }
  }
  return total;
}

export function characterCarriedLoad(equipment: CharacterEquipmentApi[]): number {
  return loadByHolder(equipment, null, { excludeVehicles: true });
}

function bardingArmorClass(item: CharacterEquipmentApi): number | undefined {
  const base = item.armor?.class?.base;
  if (base === undefined) return undefined;
  return base + (item.bonuses?.armor_class ?? 0);
}

export function equippedMountGearSlot(
  equipment: CharacterEquipmentApi[],
  holderId: string,
  slot: MountGearSlot
): CharacterEquipmentApi | undefined {
  return equipment.find(item =>
    item.equipped === true
    && item.holderId === holderId
    && item.mountGear?.slot === slot
  );
}

function vehicleDrawCapacity(
  item: CharacterEquipmentApi,
  companionsById: Map<string, CharacterCompanionApi>,
  rules: HolderStateRules
): number | null {
  const team = item.drawnBy ?? [];
  const capacities: number[] = [];
  for (const companionId of team) {
    const capacity = companionsById.get(companionId)?.carryingCapacity;
    if (capacity === null || capacity === undefined) return null;
    capacities.push(capacity);
  }
  return drawCapacity(capacities, rules);
}

function vehicleDraftInsufficient(
  item: CharacterEquipmentApi,
  companionsById: Map<string, CharacterCompanionApi>
): boolean {
  const draft = item.vehicle?.draft;
  if (!draft) return false;
  const teamIds = item.drawnBy ?? [];
  if (draft.minAnimals !== undefined && teamIds.length < draft.minAnimals) {
    return true;
  }
  if (draft.minSize) {
    if (teamIds.length === 0) return true;
    return teamIds.some(companionId => {
      const size = companionsById.get(companionId)?.creature?.size;
      return sizeMeetsMinimum(size, draft.minSize) !== true;
    });
  }
  return false;
}

export function applyInventoryHolderState(
  equipment: CharacterEquipmentApi[],
  companions: CharacterCompanionApi[],
  rules: HolderStateRules
): {
  equipment: CharacterEquipmentApi[];
  companions: CharacterCompanionApi[];
  characterLoad: number;
} {
  const mountIds = new Set(
    companions.filter(companion => companion.kind === "mount").map(companion => companion.id)
  );
  const companionsById = new Map(companions.map(companion => [companion.id, companion]));
  const priced = applyBardingPricing(equipment, mountIds, rules);

  const nextEquipment = priced.map(item => {
    if (!item.vehicle || !item.instanceId) return item;
    const load = itemWeight(item) + loadByHolder(priced, item.instanceId);
    const capacity = item.vehicle.cargoCapacity ?? null;
    const hasDraft = Boolean(item.vehicle.draft) || (item.drawnBy?.length ?? 0) > 0;
    const nextDrawCapacity = hasDraft ? vehicleDrawCapacity(item, companionsById, rules) : null;
    const warnings: string[] = [];
    if (capacity !== null && load > capacity) {
      warnings.push("overloaded");
    }
    if (hasDraft && nextDrawCapacity !== null && load > nextDrawCapacity) {
      warnings.push("overDrawCapacity");
    }
    if (vehicleDraftInsufficient(item, companionsById)) {
      warnings.push("insufficientAnimals");
    }
    return {
      ...item,
      load,
      capacity,
      drawCapacity: nextDrawCapacity,
      ...(item.vehicle.armorClass !== undefined ? { ac: item.vehicle.armorClass } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  });

  const nextCompanions = companions.map(companion => {
    const load = loadByHolder(nextEquipment, companion.id);
    const capacity = companion.carryingCapacity ?? null;
    const warnings: string[] = [];
    if (capacity !== null && load > capacity) {
      warnings.push("overloaded");
    }
    const barding = equippedMountGearSlot(nextEquipment, companion.id, "barding");
    const ac = barding ? bardingArmorClass(barding) : undefined;
    return {
      ...companion,
      load,
      capacity,
      ...(ac !== undefined ? { ac } : {}),
      ...(warnings.length > 0 ? { warnings } : {}),
    };
  });

  return {
    equipment: nextEquipment,
    companions: nextCompanions,
    characterLoad: characterCarriedLoad(nextEquipment),
  };
}
