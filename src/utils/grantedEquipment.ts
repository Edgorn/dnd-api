import { CharacterEquipmentMongo } from "../domain/types/equipment.types";
import { CharacterEquipmentCustomization } from "../domain/types/character.types";

const ROW_ONLY_FIELDS = new Set([
  "instanceId",
  "equipmentId",
  "id",
  "quantity",
  "equipped",
  "isFavorite",
  "isBond",
  "isMagic",
  "bondOrigin",
  "bondStored",
  "uniqueGranted",
  "content"
]);

export type GrantedEquipmentRowInput = string | CharacterEquipmentMongo;

export function normalizeGrantedEquipmentRows(
  rows: GrantedEquipmentRowInput[] | undefined | null
): CharacterEquipmentMongo[] {
  if (!rows?.length) return [];
  return rows.map(row => (typeof row === "string" ? { id: row, quantity: 1 } : row));
}

export function extractEquipmentCustomization(
  entry: CharacterEquipmentMongo
): CharacterEquipmentCustomization | undefined {
  const customization: CharacterEquipmentCustomization = {};

  for (const [key, value] of Object.entries(entry)) {
    if (ROW_ONLY_FIELDS.has(key) || value === undefined) continue;
    (customization as Record<string, unknown>)[key] = value;
  }

  return Object.keys(customization).length > 0 ? customization : undefined;
}

export function customizationStackKey(
  customization?: CharacterEquipmentCustomization | null
): string {
  return customization ? JSON.stringify(customization) : "";
}

export interface EquipmentFlavorPatch {
  name?: string | null;
  description?: string | string[] | null;
}

export function mergeEquipmentFlavor(
  current: CharacterEquipmentCustomization | undefined,
  patch: EquipmentFlavorPatch
): CharacterEquipmentCustomization | undefined {
  const next: CharacterEquipmentCustomization = { ...(current ?? {}) };

  if (patch.name !== undefined) {
    if (patch.name === null) {
      delete next.name;
    } else {
      next.name = patch.name;
    }
  }

  if (patch.description !== undefined) {
    if (patch.description === null) {
      delete next.description;
    } else {
      next.description = patch.description;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}
