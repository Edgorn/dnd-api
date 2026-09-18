import SystemService from "../../../domain/services/system.service";
import RaceService from "../../../domain/services/race.service";
import { AppError } from "../../../domain/errors/AppError";
import { RaceApi } from "../../../domain/types/race.types";
import { System } from "../../../domain/types/system.types";
import { systemMatchesRuleset } from "../../../utils/applyRaceOverrides";

export interface RaceOverrideContext {
  childSystem: System;
  ancestors: System[];
  race: RaceApi;
}

export async function resolveRaceOverrideContext(
  systemService: SystemService,
  raceService: RaceService,
  ruleset: string,
  sourceId: string,
  userId: string
): Promise<RaceOverrideContext> {
  const ancestry = await systemService.getAncestry(ruleset);
  if (ancestry.length === 0) {
    throw new AppError("Sistema no encontrado", 404);
  }

  const childSystem = ancestry[0];
  if (childSystem.publisher !== userId) {
    throw new AppError("No tienes permisos para modificar parches en este sistema", 403);
  }

  const race = await raceService.obtenerPorId(sourceId);
  if (!race) {
    throw new AppError("Raza no encontrada", 404);
  }

  const childRef = { id: childSystem._id.toString(), name: childSystem.name };
  if (systemMatchesRuleset(childRef, race.ruleset)) {
    throw new AppError("No se puede crear un parche sobre una raza del propio sistema; usa PUT /races/:id", 400);
  }

  const ancestors = ancestry.slice(1);
  const belongsToAncestor = ancestors.some(system =>
    systemMatchesRuleset({ id: system._id.toString(), name: system.name }, race.ruleset)
  );
  if (!belongsToAncestor) {
    throw new AppError("La raza no pertenece a un sistema ancestro", 400);
  }

  return { childSystem, ancestors, race };
}
