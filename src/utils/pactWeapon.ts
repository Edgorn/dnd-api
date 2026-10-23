import { PactWeaponOrigin, WeaponApi } from "../domain/types/equipment.types";
import { PersonajeEquipmentMongo } from "../domain/types/personajes.types";
import { TraitPactWeapon } from "../domain/types/traits.types";
import { cloneInventory, tryMerge } from "./inventoryStacks";
import { isRangedWeapon } from "./weaponAttackAttributes";

export type PactWeaponUseKind = "manifest" | "already-manifest" | "need-form";

export type PactWeaponResult =
  | { ok: true; inventory: PersonajeEquipmentMongo[] }
  | { ok: false; message: string };

export function pactWeaponFormRejection(
  config: TraitPactWeapon,
  catalog: { weapon?: Pick<WeaponApi, "range"> } | null | undefined
): string | undefined {
  if (!catalog?.weapon) return "La forma del arma de pacto debe ser un arma";
  if (config.melee && isRangedWeapon(catalog.weapon)) {
    return "La forma del arma de pacto debe ser un arma cuerpo a cuerpo";
  }
  return undefined;
}

export function ownedPactWeapon(
  traits: Array<{ pactWeapon?: TraitPactWeapon | null }>
): TraitPactWeapon | undefined {
  return traits.find(trait => trait.pactWeapon)?.pactWeapon ?? undefined;
}

export function grantsPactWeaponProficiency(
  item: { isBond?: boolean; pactStored?: boolean },
  grantsProficiency: boolean
): boolean {
  return grantsProficiency && !!item.isBond && !item.pactStored;
}

export function resolvePactWeaponUse(inventory: PersonajeEquipmentMongo[]): {
  kind: PactWeaponUseKind;
  instanceId?: string;
} {
  const row = inventory.find(item => item.isBond);
  if (!row) return { kind: "need-form" };
  if (row.pactOrigin === "bound" && row.pactStored) {
    return { kind: "manifest", instanceId: row.instanceId };
  }
  if (row.pactOrigin === "bound") {
    return { kind: "already-manifest", instanceId: row.instanceId };
  }
  return { kind: "need-form" };
}

export function stripPactFlags(item: PersonajeEquipmentMongo): PersonajeEquipmentMongo {
  const { pactOrigin: _origin, pactStored: _stored, ...rest } = item;
  return { ...rest, isBond: false };
}

export function applyManifestPactWeapon(inventory: PersonajeEquipmentMongo[]): PactWeaponResult & { instanceId?: string } {
  const idx = inventory.findIndex(item => item.isBond && item.pactOrigin === "bound" && item.pactStored);
  if (idx === -1) {
    return { ok: false, message: "No hay un arma de pacto guardada" };
  }
  const next = cloneInventory(inventory);
  const { pactStored: _stored, ...row } = next[idx];
  next[idx] = row;
  return { ok: true, inventory: next, instanceId: row.instanceId };
}

export function applySummonPactWeapon(
  inventory: PersonajeEquipmentMongo[],
  instance: PersonajeEquipmentMongo
): { inventory: PersonajeEquipmentMongo[]; instanceId: string } {
  const withoutSummoned = cloneInventory(inventory).filter(
    item => !(item.isBond && item.pactOrigin === "summoned")
  );
  return {
    inventory: [...withoutSummoned, instance],
    instanceId: instance.instanceId
  };
}

export function applyDismissPactWeapon(inventory: PersonajeEquipmentMongo[]): PactWeaponResult {
  const idx = inventory.findIndex(item => item.isBond && !item.pactStored);
  if (idx === -1) {
    return { ok: false, message: "No hay arma de pacto manifiesta" };
  }
  const item = inventory[idx];
  if (item.pactOrigin === "summoned") {
    return { ok: true, inventory: cloneInventory(inventory).filter((_, index) => index !== idx) };
  }
  const next = cloneInventory(inventory);
  next[idx] = { ...next[idx], pactStored: true, equipped: false };
  return { ok: true, inventory: next };
}

export function applyBindPactWeapon(
  inventory: PersonajeEquipmentMongo[],
  instanceId: string
): PactWeaponResult {
  const target = inventory.find(item => item.instanceId === instanceId);
  if (!target) {
    return { ok: false, message: "No se encontró el equipamiento en el personaje" };
  }
  if (target.pactOrigin === "summoned") {
    return { ok: false, message: "Las armas invocadas se descartan con la acción del rasgo" };
  }

  const next = cloneInventory(inventory)
    .filter(item => !(item.isBond && item.pactOrigin === "summoned" && item.instanceId !== instanceId))
    .map(item => {
      if (item.instanceId === instanceId) {
        return {
          ...item,
          isBond: true,
          pactOrigin: "bound" as PactWeaponOrigin,
          pactStored: false,
          quantity: 1
        };
      }
      if (item.isBond) return stripPactFlags(item);
      return item;
    });

  return { ok: true, inventory: next };
}

export function applyUnbindPactWeapon(
  inventory: PersonajeEquipmentMongo[],
  instanceId: string
): PactWeaponResult {
  const item = inventory.find(row => row.instanceId === instanceId);
  if (!item?.isBond) {
    return { ok: false, message: "El equipamiento no está vinculado por pacto" };
  }
  if (item.pactOrigin === "summoned") {
    return { ok: false, message: "Las armas invocadas se descartan con la acción del rasgo" };
  }

  const next = cloneInventory(inventory).map(row =>
    row.instanceId === instanceId ? stripPactFlags(row) : row
  );
  return { ok: true, inventory: tryMerge(next, instanceId) };
}

export function clearPactWeaponOnTraitLost(
  inventory: PersonajeEquipmentMongo[]
): PersonajeEquipmentMongo[] {
  return cloneInventory(inventory).flatMap(item => {
    if (!item.isBond) return [item];
    if (item.pactOrigin === "summoned") return [];
    return [stripPactFlags(item)];
  });
}
