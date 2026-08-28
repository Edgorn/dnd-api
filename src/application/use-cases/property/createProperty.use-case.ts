import PropertyService from "../../../domain/services/property.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { Property, InputCreateProperty } from "../../../domain/types/property.types";

export default class CreateProperty {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateProperty, userId: string): Promise<Property> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear propiedades en este sistema", 403);
    }

    return this.propertyService.create(data);
  }
}
