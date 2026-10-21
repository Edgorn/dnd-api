import CreatureService from "../../../domain/services/creature.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { InputCreatureForm } from "../../../domain/types/creatureForm.types";

export async function assertSpellCreatureFormRefs(input: {
  ruleset: string;
  creatureForm?: InputCreatureForm | null;
  creatureService: CreatureService;
  creatureTypeService: CreatureTypeService;
  systemService: SystemService;
}): Promise<void> {
  const form = input.creatureForm;
  if (!form) return;

  const creatureIds = form.pool.mode === "ids" ? uniqueIds(form.pool.creatureIds) : [];
  const creatureTypeIds = form.pool.mode === "filter"
    ? uniqueIds(form.pool.creatureTypeIds ?? [])
    : [];

  if (!creatureIds.length && !creatureTypeIds.length) return;

  const allowedRulesets = await input.systemService.getSystemsAndAncestors([input.ruleset]);

  for (const creatureId of creatureIds) {
    const creature = await input.creatureService.getById(creatureId);
    if (!creature || creature.deletedAt) {
      throw new AppError("Criatura no encontrada", 404);
    }
    if (!allowedRulesets.includes(creature.ruleset)) {
      throw new AppError("La criatura no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  for (const creatureTypeId of creatureTypeIds) {
    const creatureType = await input.creatureTypeService.getById(creatureTypeId);
    if (!creatureType || creatureType.deletedAt) {
      throw new AppError("Tipo de criatura no encontrado", 404);
    }
    if (!allowedRulesets.includes(creatureType.ruleset)) {
      throw new AppError("El tipo de criatura no pertenece a este sistema ni a sus ancestros", 400);
    }
  }
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
}
