import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreRace {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const race = await this.raceService.obtenerPorId(id);
    if (!race) {
      throw new AppError("Raza no encontrada", 404);
    }

    const system = await this.systemService.getById(race.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar esta raza", 403);
    }

    await this.raceService.restore(id);
  }
}
