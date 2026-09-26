import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreatureTypeApi, InputCreateCreatureType } from "../../../domain/types/creatureType.types";

export default class CreateCreatureType {
  constructor(
    private readonly creatureTypeService: CreatureTypeService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateCreatureType, userId: string): Promise<CreatureTypeApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear tipos de criatura en este sistema", 403);
    }

    return this.creatureTypeService.create(data);
  }
}
