import TraitService from "../../../domain/services/trait.service";
import { TraitApi } from "../../../domain/types/traits.types";

export default class GetTraitsBySystemsUseCase {
  constructor(private readonly traitService: TraitService) { }

  execute(ruleset: string[]): Promise<TraitApi[]> {
    return this.traitService.getBySystems(ruleset);
  }
}
