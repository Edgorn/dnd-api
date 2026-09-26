import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreatureTypeApi, InputUpdateCreatureType } from "../../../domain/types/creatureType.types";

export default class UpdateCreatureType {
  constructor(
    private readonly creatureTypeService: CreatureTypeService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateCreatureType, userId: string): Promise<CreatureTypeApi> {
    const existing = await this.creatureTypeService.getById(data.id);
    if (!existing) {
      throw new AppError("Tipo de criatura no encontrado", 404);
    }

    await this.assertPublisher(existing.ruleset, userId, "No tienes permisos para editar este tipo de criatura");

    if (data.ruleset && data.ruleset !== existing.ruleset) {
      await this.assertPublisher(data.ruleset, userId, "No tienes permisos para mover este tipo de criatura a ese sistema");
    }

    return this.creatureTypeService.update(data);
  }

  private async assertPublisher(ruleset: string, userId: string, forbiddenMessage: string): Promise<void> {
    const system = await this.systemService.getById(ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError(forbiddenMessage, 403);
    }
  }
}
