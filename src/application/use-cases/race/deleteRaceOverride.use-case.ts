import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { AppError } from "../../../domain/errors/AppError";
import { resolveRaceOverrideContext } from "./resolveRaceOverrideContext";

export default class DeleteRaceOverride {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) {}

  async execute(sourceId: string, ruleset: string, userId: string): Promise<void> {
    const { childSystem } = await resolveRaceOverrideContext(
      this.systemService,
      this.raceService,
      ruleset,
      sourceId,
      userId
    );

    const deleted = await this.entityOverrideService.softDelete(
      childSystem._id.toString(),
      "race",
      sourceId
    );

    if (!deleted) {
      throw new AppError("Parche de raza no encontrado", 404);
    }
  }
}
