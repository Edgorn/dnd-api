import { AttributeApi, InputCreateAttribute, InputUpdateAttribute } from "../types/attribute.types";

export default interface IAttributeRepository {
  create(data: InputCreateAttribute): Promise<AttributeApi>;
  update(data: InputUpdateAttribute): Promise<AttributeApi>;
  getBySystems(rulesets: string[]): Promise<AttributeApi[]>;
  getById(id: string): Promise<AttributeApi | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
