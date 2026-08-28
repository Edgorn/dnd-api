import IPropertyRepository from "../repositories/IPropertyRepository";
import { Property, InputCreateProperty, InputUpdateProperty } from "../types/property.types";

export default class PropertyService {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  create(data: InputCreateProperty): Promise<Property> {
    return this.propertyRepository.create(data);
  }

  update(data: InputUpdateProperty): Promise<Property> {
    return this.propertyRepository.update(data);
  }

  getBySystems(rulesets: string[]): Promise<Property[]> {
    return this.propertyRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<Property | null> {
    return this.propertyRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<Property[]> {
    return this.propertyRepository.getByIds(ids);
  }

  softDelete(id: string): Promise<void> {
    return this.propertyRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.propertyRepository.restore(id);
  }
}
