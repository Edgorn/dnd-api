import ICreatureRepository from "../repositories/ICreatureRepository";
import {
  CreateCreature,
  CreatureApi,
  CreatureListFilters,
  UpdateCreature
} from "../types/creature.types";

export default class CreatureService {
  constructor(private readonly creatureRepository: ICreatureRepository) {}

  getBySystems(rulesets: string[], filters?: CreatureListFilters, userId?: string): Promise<CreatureApi[]> {
    return this.creatureRepository.getBySystems(rulesets, filters, userId);
  }

  getById(id: string): Promise<CreatureApi | null> {
    return this.creatureRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<CreatureApi[]> {
    return this.creatureRepository.getByIds(ids);
  }

  create(data: CreateCreature): Promise<CreatureApi> {
    return this.creatureRepository.create(data);
  }

  update(data: UpdateCreature): Promise<CreatureApi> {
    return this.creatureRepository.update(data);
  }

  softDelete(id: string): Promise<void> {
    return this.creatureRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.creatureRepository.restore(id);
  }
}
