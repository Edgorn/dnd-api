import PropertyService from "../../../domain/services/property.service";
import { NotFoundError } from "../../../domain/errors/AppError";
import { Property } from "../../../domain/types/property.types";

export default class GetPropertyById {
  constructor(private readonly propertyService: PropertyService) {}

  async execute(id: string): Promise<Property> {
    const property = await this.propertyService.getById(id);
    if (!property) {
      throw new NotFoundError(`No se encontró la propiedad con id: ${id}`);
    }
    return property;
  }
}
