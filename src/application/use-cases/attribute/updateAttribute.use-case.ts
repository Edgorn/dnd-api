import AttributeService from "../../../domain/services/attribute.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { AttributeApi, InputUpdateAttribute } from "../../../domain/types/attribute.types";

export default class UpdateAttribute {
  constructor(
    private readonly attributeService: AttributeService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputUpdateAttribute, userId: string): Promise<AttributeApi> {
    const attribute = await this.attributeService.getById(data.id);
    if (!attribute) {
      throw new AppError("Atributo no encontrado", 404);
    }

    const system = await this.systemService.getById(attribute.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar este atributo", 403);
    }

    return this.attributeService.update(data);
  }
}
