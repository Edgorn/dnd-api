import IOptionGroupRepository from "../repositories/IOptionGroupRepository";
import {
  InputCreateOptionGroup,
  InputUpdateOptionGroup,
  OptionGroupApi
} from "../types/optionGroup.types";

export default class OptionGroupService {
  constructor(private readonly optionGroupRepository: IOptionGroupRepository) {}

  create(data: InputCreateOptionGroup): Promise<OptionGroupApi> {
    return this.optionGroupRepository.create(data);
  }

  update(data: InputUpdateOptionGroup): Promise<OptionGroupApi> {
    return this.optionGroupRepository.update(data);
  }

  getBySystems(rulesets: string[], expandAncestry: boolean = true): Promise<OptionGroupApi[]> {
    return this.optionGroupRepository.getBySystems(rulesets, expandAncestry);
  }

  getById(id: string): Promise<OptionGroupApi | null> {
    return this.optionGroupRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<OptionGroupApi[]> {
    return this.optionGroupRepository.getByIds(ids);
  }

  softDelete(id: string): Promise<void> {
    return this.optionGroupRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.optionGroupRepository.restore(id);
  }
}
