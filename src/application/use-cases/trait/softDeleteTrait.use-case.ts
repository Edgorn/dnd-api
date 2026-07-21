import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteTraitUseCase {
  constructor(
    private readonly traitService: TraitService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const trait = await this.traitService.getById(id);
    if (!trait) {
      throw new AppError("Trait no encontrado", 404);
    }

    const system = await this.systemService.getById(trait.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar este rasgo", 403);
    }

    await this.traitService.softDelete(id);
  }
}
