import { CreateTrait, TraitApi, TraitDataMongo, TraitsOptionsApi, TraitsOptionsMongo, UpdateTrait } from "../types/traits.types";

export default interface ITraitRepository {
  getBySystems(ruleset: string[]): Promise<TraitApi[]>
  getTraitsByIndexes(params: string[], data?: TraitDataMongo): Promise<TraitApi[]>
  getTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined>
  getById(id: string): Promise<TraitApi | null>
  create(trait: CreateTrait): Promise<TraitApi>
  update(trait: UpdateTrait): Promise<TraitApi>
  softDelete(id: string): Promise<void>
  restore(id: string): Promise<void>
}
