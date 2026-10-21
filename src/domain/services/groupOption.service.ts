import IGroupOptionRepository from "../repositories/IGroupOptionRepository";
import {
  GroupOptionApi,
  InputCreateGroupOption,
  InputUpdateGroupOption
} from "../types/optionGroup.types";

export default class GroupOptionService {
  constructor(private readonly groupOptionRepository: IGroupOptionRepository) {}

  create(data: InputCreateGroupOption): Promise<GroupOptionApi> {
    return this.groupOptionRepository.create(data);
  }

  update(data: InputUpdateGroupOption): Promise<GroupOptionApi> {
    return this.groupOptionRepository.update(data);
  }

  getByGroup(groupId: string, rulesets: string[], expandAncestry: boolean = true): Promise<GroupOptionApi[]> {
    return this.groupOptionRepository.getByGroup(groupId, rulesets, expandAncestry);
  }

  getBySystems(rulesets: string[], expandAncestry: boolean = true): Promise<GroupOptionApi[]> {
    return this.groupOptionRepository.getBySystems(rulesets, expandAncestry);
  }

  getById(id: string): Promise<GroupOptionApi | null> {
    return this.groupOptionRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<GroupOptionApi[]> {
    return this.groupOptionRepository.getByIds(ids);
  }

  softDelete(id: string): Promise<void> {
    return this.groupOptionRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.groupOptionRepository.restore(id);
  }
}
