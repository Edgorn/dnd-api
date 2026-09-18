import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { AppError } from "../../../domain/errors/AppError";
import { EntityOverrideApi } from "../../../domain/types/entityOverride.types";
import { resolveRaceOverrideContext } from "./resolveRaceOverrideContext";

export default class GetRaceOverride {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) {}

  async execute(sourceId: string, ruleset: string, userId: string): Promise<EntityOverrideApi> {
    const { childSystem } = await resolveRaceOverrideContext(
      this.systemService,
      this.raceService,
      ruleset,
      sourceId,
      userId
    );

    const overlay = await this.entityOverrideService.getBySource(
      childSystem._id.toString(),
      "race",
      sourceId
    );

    if (!overlay) {
      throw new AppError("Parche de raza no encontrado", 404);
    }

    return overlay;
  }
}
