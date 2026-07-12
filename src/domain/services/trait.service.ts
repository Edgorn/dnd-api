import ITraitRepository from "../repositories/ITraitRepository";
import { CreateTrait, TraitApi, UpdateTrait, TraitDataMongo, TraitsOptionsMongo, TraitsOptionsApi } from "../types/traits.types";

export default class TraitService {
  constructor(private readonly traitRepository: ITraitRepository) { }

  getBySystems(ruleset: string[]): Promise<TraitApi[]> {
    return this.traitRepository.getBySystems(ruleset);
  }

  getTraitsByIndexes(params: string[], data?: TraitDataMongo): Promise<TraitApi[]> {
    return this.traitRepository.getTraitsByIndexes(params, data);
  }

  getTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined> {
    return this.traitRepository.getTraitsOptions(traitsOptions);
  }

  getById(id: string): Promise<TraitApi | null> {
    return this.traitRepository.getById(id);
  }

  create(trait: CreateTrait): Promise<TraitApi> {
    return this.traitRepository.create(trait);
  }

  update(trait: UpdateTrait): Promise<TraitApi> {
    return this.traitRepository.update(trait);
  }

  softDelete(id: string): Promise<void> {
    return this.traitRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.traitRepository.restore(id);
  }
}
