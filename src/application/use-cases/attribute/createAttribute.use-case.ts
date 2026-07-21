import AttributeService from "../../../domain/services/attribute.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { AttributeApi, InputCreateAttribute } from "../../../domain/types/attribute.types";

export default class CreateAttribute {
  constructor(
    private readonly attributeService: AttributeService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputCreateAttribute, userId: string): Promise<AttributeApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear atributos en este sistema", 403);
    }

    return this.attributeService.create(data);
  }
}
