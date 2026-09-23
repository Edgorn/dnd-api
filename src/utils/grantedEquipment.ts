import { CharacterEquipmentMongo } from "../domain/types/equipment.types";
import { PersonajeEquipmentCustomization } from "../domain/types/personajes.types";

const ROW_ONLY_FIELDS = new Set([
  "instanceId",
  "equipmentId",
  "id",
  "quantity",
  "equipped",
  "isFavorite",
  "isBond",
  "isMagic",
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
): PersonajeEquipmentCustomization | undefined {
  const customization: PersonajeEquipmentCustomization = {};

  for (const [key, value] of Object.entries(entry)) {
    if (ROW_ONLY_FIELDS.has(key) || value === undefined) continue;
    (customization as Record<string, unknown>)[key] = value;
  }

  return Object.keys(customization).length > 0 ? customization : undefined;
}

export function customizationStackKey(
  customization?: PersonajeEquipmentCustomization | null
): string {
  return customization ? JSON.stringify(customization) : "";
}
