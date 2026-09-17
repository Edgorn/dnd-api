import FeatService from "../../../domain/services/feat.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreFeat {
  constructor(
    private readonly featService: FeatService,
    private readonly systemService: SystemService
  ) { }

  async execute(id: string, userId: string): Promise<void> {
    const feat = await this.featService.getById(id);
    if (!feat) {
      throw new AppError("Dote no encontrado", 404);
    }

    const system = await this.systemService.getById(feat.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este dote", 403);
    }

    await this.featService.restore(id);
  }
}
