import ICreatureTypeRepository from "../repositories/ICreatureTypeRepository";
import {
  CreatureTypeApi,
  InputCreateCreatureType,
  InputUpdateCreatureType
} from "../types/creatureType.types";

export default class CreatureTypeService {
  constructor(private readonly creatureTypeRepository: ICreatureTypeRepository) {}

  getBySystems(rulesets: string[], userId?: string): Promise<CreatureTypeApi[]> {
    return this.creatureTypeRepository.getBySystems(rulesets, userId);
  }

  getById(id: string): Promise<CreatureTypeApi | null> {
    return this.creatureTypeRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<CreatureTypeApi[]> {
    return this.creatureTypeRepository.getByIds(ids);
  }

  create(data: InputCreateCreatureType): Promise<CreatureTypeApi> {
    return this.creatureTypeRepository.create(data);
  }

  update(data: InputUpdateCreatureType): Promise<CreatureTypeApi> {
    return this.creatureTypeRepository.update(data);
  }

  softDelete(id: string): Promise<void> {
    return this.creatureTypeRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.creatureTypeRepository.restore(id);
  }
}
