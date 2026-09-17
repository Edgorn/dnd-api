import FeatService from "../../../domain/services/feat.service";
import { FeatApi } from "../../../domain/types/feat.types";

export default class GetFeatsBySystems {
  constructor(private readonly featService: FeatService) { }

  execute(rulesets: string[], userId?: string): Promise<FeatApi[]> {
    return this.featService.getBySystems(rulesets, userId);
  }
}
