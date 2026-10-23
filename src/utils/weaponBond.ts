import { WeaponBondOrigin, WeaponApi } from "../domain/types/equipment.types";
import { PersonajeEquipmentMongo } from "../domain/types/personajes.types";
import { TraitWeaponBond } from "../domain/types/traits.types";
import { cloneInventory, tryMerge } from "./inventoryStacks";
import { isRangedWeapon } from "./weaponAttackAttributes";

export type WeaponBondUseKind = "manifest" | "already-manifest" | "need-form";

export type WeaponBondResult =
  | { ok: true; inventory: PersonajeEquipmentMongo[] }
  | { ok: false; message: string };

export function weaponBondFormRejection(
  config: TraitWeaponBond,
  catalog: { weapon?: Pick<WeaponApi, "range"> } | null | undefined
): string | undefined {
  if (!catalog?.weapon) return "La forma del arma vinculada debe ser un arma";
  if (config.melee && isRangedWeapon(catalog.weapon)) {
    return "La forma del arma vinculada debe ser un arma cuerpo a cuerpo";
  }
  return undefined;
}

export function ownedWeaponBond(
  traits: Array<{ weaponBond?: TraitWeaponBond | null }>
): TraitWeaponBond | undefined {
  return traits.find(trait => trait.weaponBond)?.weaponBond ?? undefined;
}

export function grantsWeaponBondProficiency(
  item: { isBond?: boolean; bondStored?: boolean },
  grantsProficiency: boolean
): boolean {
  return grantsProficiency && !!item.isBond && !item.bondStored;
}

export function resolveWeaponBondUse(inventory: PersonajeEquipmentMongo[]): {
  kind: WeaponBondUseKind;
  instanceId?: string;
} {
  const row = inventory.find(item => item.isBond);
  if (!row) return { kind: "need-form" };
  if (row.bondOrigin === "bound" && row.bondStored) {
    return { kind: "manifest", instanceId: row.instanceId };
  }
  if (row.bondOrigin === "bound") {
    return { kind: "already-manifest", instanceId: row.instanceId };
  }
  return { kind: "need-form" };
}

export function stripBondFlags(item: PersonajeEquipmentMongo): PersonajeEquipmentMongo {
  const { bondOrigin: _origin, bondStored: _stored, ...rest } = item;
  return { ...rest, isBond: false };
}

export function applyManifestWeaponBond(inventory: PersonajeEquipmentMongo[]): WeaponBondResult & { instanceId?: string } {
  const idx = inventory.findIndex(item => item.isBond && item.bondOrigin === "bound" && item.bondStored);
  if (idx === -1) {
    return { ok: false, message: "No hay un arma vinculada guardada" };
  }
  const next = cloneInventory(inventory);
  const { bondStored: _stored, ...row } = next[idx];
  next[idx] = row;
  return { ok: true, inventory: next, instanceId: row.instanceId };
}

export function applySummonWeaponBond(
  inventory: PersonajeEquipmentMongo[],
  instance: PersonajeEquipmentMongo
): { inventory: PersonajeEquipmentMongo[]; instanceId: string } {
  const withoutSummoned = cloneInventory(inventory).filter(
    item => !(item.isBond && item.bondOrigin === "summoned")
  );
  return {
    inventory: [...withoutSummoned, instance],
    instanceId: instance.instanceId
  };
}

export function applyDismissWeaponBond(inventory: PersonajeEquipmentMongo[]): WeaponBondResult {
  const idx = inventory.findIndex(item => item.isBond && !item.bondStored);
  if (idx === -1) {
    return { ok: false, message: "No hay arma vinculada manifiesta" };
  }
  const item = inventory[idx];
  if (item.bondOrigin === "summoned") {
    return { ok: true, inventory: cloneInventory(inventory).filter((_, index) => index !== idx) };
  }
  const next = cloneInventory(inventory);
  next[idx] = { ...next[idx], bondStored: true, equipped: false };
  return { ok: true, inventory: next };
}

export function applyBindWeaponBond(
  inventory: PersonajeEquipmentMongo[],
  instanceId: string
): WeaponBondResult {
  const target = inventory.find(item => item.instanceId === instanceId);
  if (!target) {
    return { ok: false, message: "No se encontró el equipamiento en el personaje" };
  }
  if (target.bondOrigin === "summoned") {
    return { ok: false, message: "Las armas invocadas se descartan con la acción del rasgo" };
  }

  const next = cloneInventory(inventory)
    .filter(item => !(item.isBond && item.bondOrigin === "summoned" && item.instanceId !== instanceId))
    .map(item => {
      if (item.instanceId === instanceId) {
        return {
          ...item,
          isBond: true,
          bondOrigin: "bound" as WeaponBondOrigin,
          bondStored: false,
          quantity: 1
        };
      }
      if (item.isBond) return stripBondFlags(item);
      return item;
    });

  return { ok: true, inventory: next };
}

export function applyUnbindWeaponBond(
  inventory: PersonajeEquipmentMongo[],
  instanceId: string
): WeaponBondResult {
  const item = inventory.find(row => row.instanceId === instanceId);
  if (!item?.isBond) {
    return { ok: false, message: "El equipamiento no está vinculado" };
  }
  if (item.bondOrigin === "summoned") {
    return { ok: false, message: "Las armas invocadas se descartan con la acción del rasgo" };
  }

  const next = cloneInventory(inventory).map(row =>
    row.instanceId === instanceId ? stripBondFlags(row) : row
  );
  return { ok: true, inventory: tryMerge(next, instanceId) };
}

export function clearWeaponBondOnTraitLost(
  inventory: PersonajeEquipmentMongo[]
): PersonajeEquipmentMongo[] {
  return cloneInventory(inventory).flatMap(item => {
    if (!item.isBond) return [item];
    if (item.bondOrigin === "summoned") return [];
    return [stripBondFlags(item)];
  });
}
