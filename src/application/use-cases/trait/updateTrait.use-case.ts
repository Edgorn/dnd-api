import TraitService from "../../../domain/services/trait.service";
import { TraitApi, UpdateTrait } from "../../../domain/types/traits.types";

export default class UpdateTraitUseCase {
  constructor(private readonly traitService: TraitService) { }

  execute(trait: UpdateTrait): Promise<TraitApi> {
    return this.traitService.update(trait);
  }
}
