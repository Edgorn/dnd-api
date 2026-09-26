import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteCreatureType {
  constructor(
    private readonly creatureTypeService: CreatureTypeService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const creatureType = await this.creatureTypeService.getById(id);
    if (!creatureType) {
      throw new AppError("Tipo de criatura no encontrado", 404);
    }

    const system = await this.systemService.getById(creatureType.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar este tipo de criatura", 403);
    }

    await this.creatureTypeService.softDelete(id);
  }
}
