import CreatureTypeService from "../../../domain/services/creatureType.service";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export async function assertCreatureTypeForRuleset(
  creatureTypeId: string | null | undefined,
  ruleset: string,
  creatureTypeService: CreatureTypeService,
  systemService: SystemService
): Promise<void> {
  if (!creatureTypeId) return;

  const creatureType = await creatureTypeService.getById(creatureTypeId);
  if (!creatureType || creatureType.deletedAt) {
    throw new AppError("Tipo de criatura no encontrado", 404);
  }

  const allowedRulesets = await systemService.getSystemsAndAncestors([ruleset]);
  if (!allowedRulesets.includes(creatureType.ruleset)) {
    throw new AppError("El tipo de criatura no pertenece a este sistema ni a sus ancestros", 400);
  }
}

export async function assertSubracePlayable(
  playable: boolean,
  parentId: string | null | undefined,
  raceService: RaceService
): Promise<void> {
  if (!playable || !parentId) return;

  const parent = await raceService.obtenerPorId(parentId);
  if (!parent) {
    throw new AppError("Raza padre no encontrada", 404);
  }

  if (!parent.playable) {
    throw new AppError("Una subraza no puede ser jugable si su raza padre no lo es", 400);
  }
}
