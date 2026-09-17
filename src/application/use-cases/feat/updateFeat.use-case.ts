import FeatService from "../../../domain/services/feat.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { FeatApi, InputUpdateFeat } from "../../../domain/types/feat.types";

export default class UpdateFeat {
  constructor(
    private readonly featService: FeatService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputUpdateFeat, userId: string): Promise<FeatApi> {
    const feat = await this.featService.getById(data.id);
    if (!feat) {
      throw new AppError("Dote no encontrado", 404);
    }

    const system = await this.systemService.getById(feat.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar este dote", 403);
    }

    return this.featService.update(data);
  }
}
