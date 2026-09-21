import ArmorTypeService from "../../../domain/services/armorType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { ArmorInput } from "../../../domain/types/equipment.types";

export async function assertArmorTypesForRuleset(
  typeIds: string[] | null | undefined,
  ruleset: string,
  armorTypeService: ArmorTypeService,
  systemService: SystemService
): Promise<void> {
  if (!typeIds?.length) return;

  const uniqueIds = [...new Set(typeIds)];
  const allowedRulesets = await systemService.getSystemsAndAncestors([ruleset]);

  for (const typeId of uniqueIds) {
    const armorType = await armorTypeService.getById(typeId);
    if (!armorType || armorType.deletedAt) {
      throw new AppError("Tipo de armadura no encontrado", 404);
    }

    if (!allowedRulesets.includes(armorType.ruleset)) {
      throw new AppError("El tipo de armadura no pertenece a este sistema ni a sus ancestros", 400);
    }
  }
}

export async function assertArmorTypeForRuleset(
  armor: ArmorInput | null | undefined,
  ruleset: string,
  armorTypeService: ArmorTypeService,
  systemService: SystemService
): Promise<void> {
  if (!armor?.typeId) return;
  await assertArmorTypesForRuleset([armor.typeId], ruleset, armorTypeService, systemService);
}
