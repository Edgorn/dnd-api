import { ChoiceApi, ChoiceMongo } from "../types";
import { CreateTrait, TraitApi, TraitArmorClassInput, TraitDataMongo, TraitNameRef, UpdateTrait } from "../types/traits.types";

export default interface ITraitRepository {
  getBySystems(ruleset: string[]): Promise<TraitApi[]>
  getTraitsByIndexes(params: string[], data?: TraitDataMongo): Promise<TraitApi[]>
  getArmorClassInputsByIds(ids: string[]): Promise<TraitArmorClassInput[]>
  getNameRefsByIds(ids: string[]): Promise<TraitNameRef[]>
  formatTraitChoices(choices?: ChoiceMongo[]): Promise<ChoiceApi<TraitApi>[]>
  getById(id: string): Promise<TraitApi | null>
  create(trait: CreateTrait): Promise<TraitApi>
  update(trait: UpdateTrait): Promise<TraitApi>
  softDelete(id: string): Promise<void>
  restore(id: string): Promise<void>
}
