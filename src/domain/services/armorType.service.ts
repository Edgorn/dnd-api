import IArmorTypeRepository from "../repositories/IArmorTypeRepository";
import { ArmorType, InputCreateArmorType, InputUpdateArmorType } from "../types/armorType.types";

export default class ArmorTypeService {
  constructor(private readonly armorTypeRepository: IArmorTypeRepository) {}

  create(data: InputCreateArmorType): Promise<ArmorType> {
    return this.armorTypeRepository.create(data);
  }

  update(data: InputUpdateArmorType): Promise<ArmorType> {
    return this.armorTypeRepository.update(data);
  }

  getBySystems(rulesets: string[]): Promise<ArmorType[]> {
    return this.armorTypeRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<ArmorType | null> {
    return this.armorTypeRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<ArmorType[]> {
    return this.armorTypeRepository.getByIds(ids);
  }

  softDelete(id: string): Promise<void> {
    return this.armorTypeRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.armorTypeRepository.restore(id);
  }
}
