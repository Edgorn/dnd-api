import IDamageRepository from "../repositories/IDamageRepository";
import { Damage, InputCreateDamage, InputUpdateDamage } from "../types/damage.types";

export default class DamageService {
  constructor(private readonly damageRepository: IDamageRepository) {}

  create(data: InputCreateDamage): Promise<Damage> {
    return this.damageRepository.create(data);
  }

  update(data: InputUpdateDamage): Promise<Damage> {
    return this.damageRepository.update(data);
  }

  getBySystems(rulesets: string[]): Promise<Damage[]> {
    return this.damageRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<Damage | null> {
    return this.damageRepository.getById(id);
  }

  getByIds(ids: string[], includeDeleted = false): Promise<Damage[]> {
    return this.damageRepository.getByIds(ids, includeDeleted);
  }

  softDelete(id: string): Promise<void> {
    return this.damageRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.damageRepository.restore(id);
  }
}
