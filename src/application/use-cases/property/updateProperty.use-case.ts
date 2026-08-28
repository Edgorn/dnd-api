import PropertyService from "../../../domain/services/property.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { Property, InputUpdateProperty } from "../../../domain/types/property.types";

export default class UpdateProperty {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateProperty, userId: string): Promise<Property> {
    const property = await this.propertyService.getById(data.id);
    if (!property) {
      throw new AppError("Propiedad no encontrada", 404);
    }

    const system = await this.systemService.getById(property.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para editar esta propiedad", 403);
    }

    return this.propertyService.update(data);
  }
}
