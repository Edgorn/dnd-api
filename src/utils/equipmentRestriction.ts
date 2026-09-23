import { EquipmentMaterial } from "../domain/types/equipment.types";
import {
  EquipmentRestriction,
  EquipmentRestrictionScope
} from "../domain/types/traits.types";

export interface RestrictableEquipment {
  equipSlot?: string | null;
  materials?: string[] | null;
  armor?: {
    class?: unknown;
  } | null;
}

export interface EquipmentRestrictionTrait {
  equipmentRestriction?: EquipmentRestriction | null;
}

function matchesScope(item: RestrictableEquipment, scope: EquipmentRestrictionScope): boolean {
  if (scope === "armor") {
    return item.equipSlot === "armor";
  }
  return item.equipSlot === "off_hand" && item.armor?.class != null;
}

function sharesMaterial(materials: string[], expected: EquipmentMaterial[] | undefined): boolean {
  if (!expected?.length) return false;
  return expected.some(material => materials.includes(material));
}

export function findBlockedEquipmentRestriction(
  item: RestrictableEquipment,
  traits: EquipmentRestrictionTrait[]
): EquipmentRestriction | undefined {
  const materials = item.materials ?? [];
  if (materials.length === 0) return undefined;

  return traits.find(trait => {
    const restriction = trait.equipmentRestriction;
    if (!restriction || restriction.enforcement !== "block") return false;
    if (!restriction.scopes.some(scope => matchesScope(item, scope))) return false;
    if (!sharesMaterial(materials, restriction.forbiddenMaterials)) return false;
    if (sharesMaterial(materials, restriction.unlessMaterials)) return false;
    return true;
  })?.equipmentRestriction ?? undefined;
}
