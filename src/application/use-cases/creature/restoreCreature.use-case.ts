import CreatureService from "../../../domain/services/creature.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreCreature {
  constructor(
    private readonly creatureService: CreatureService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const existing = await this.creatureService.getById(id);
    if (!existing) {
      throw new AppError("Criatura no encontrada", 404);
    }

    const system = await this.systemService.getById(existing.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }
    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar esta criatura", 403);
    }

    await this.creatureService.restore(id);
  }
}
