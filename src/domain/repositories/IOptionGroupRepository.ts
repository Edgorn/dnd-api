import { InputCreateOptionGroup, InputUpdateOptionGroup, OptionGroupApi } from "../types/optionGroup.types";

export default interface IOptionGroupRepository {
  create(data: InputCreateOptionGroup): Promise<OptionGroupApi>;
  update(data: InputUpdateOptionGroup): Promise<OptionGroupApi>;
  getBySystems(rulesets: string[], expandAncestry?: boolean): Promise<OptionGroupApi[]>;
  getById(id: string): Promise<OptionGroupApi | null>;
  getByIds(ids: string[]): Promise<OptionGroupApi[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
