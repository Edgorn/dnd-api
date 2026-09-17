import FeatService from "../../../domain/services/feat.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { FeatApi, InputCreateFeat } from "../../../domain/types/feat.types";

export default class CreateFeat {
  constructor(
    private readonly featService: FeatService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputCreateFeat, userId: string): Promise<FeatApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear dotes en este sistema", 403);
    }

    return this.featService.create(data);
  }
}
