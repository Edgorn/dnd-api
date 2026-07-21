import AttributeService from "../../../domain/services/attribute.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreAttribute {
  constructor(
    private readonly attributeService: AttributeService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const attribute = await this.attributeService.getById(id);
    if (!attribute) {
      throw new AppError("Atributo no encontrado", 404);
    }

    const system = await this.systemService.getById(attribute.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este atributo", 403);
    }

    await this.attributeService.restore(id);
  }
}
