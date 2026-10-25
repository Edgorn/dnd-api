import { GroupOptionApi, InputCreateGroupOption, InputUpdateGroupOption } from "../types/optionGroup.types";

export default interface IGroupOptionRepository {
  create(data: InputCreateGroupOption): Promise<GroupOptionApi>;
  update(data: InputUpdateGroupOption): Promise<GroupOptionApi>;
  getByGroup(groupId: string, rulesets: string[], expandAncestry?: boolean): Promise<GroupOptionApi[]>;
  getBySystems(rulesets: string[], expandAncestry?: boolean): Promise<GroupOptionApi[]>;
  getByGroupIds(groupIds: string[], rulesets: string[], expandAncestry?: boolean): Promise<GroupOptionApi[]>;
  getById(id: string): Promise<GroupOptionApi | null>;
  getByIds(ids: string[]): Promise<GroupOptionApi[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
