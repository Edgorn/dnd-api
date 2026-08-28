import { Property, InputCreateProperty, InputUpdateProperty } from "../types/property.types";

export default interface IPropertyRepository {
  create(data: InputCreateProperty): Promise<Property>;
  update(data: InputUpdateProperty): Promise<Property>;
  getById(id: string): Promise<Property | null>;
  getByIds(ids: string[]): Promise<Property[]>;
  getBySystems(rulesets: string[]): Promise<Property[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
