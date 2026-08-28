import PropertyService from "../../../domain/services/property.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteProperty {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const property = await this.propertyService.getById(id);
    if (!property) {
      throw new AppError("Propiedad no encontrada", 404);
    }

    const system = await this.systemService.getById(property.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar esta propiedad", 403);
    }

    await this.propertyService.softDelete(id);
  }
}
