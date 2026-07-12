import TraitService from "../../../domain/services/trait.service";
import { CreateTrait, TraitApi } from "../../../domain/types/traits.types";

export default class CreateTraitUseCase {
  constructor(private readonly traitService: TraitService) { }

  execute(trait: CreateTrait): Promise<TraitApi> {
    return this.traitService.create(trait);
  }
}
