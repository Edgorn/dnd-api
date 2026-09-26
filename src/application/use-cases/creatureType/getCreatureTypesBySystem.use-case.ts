import CreatureTypeService from "../../../domain/services/creatureType.service";
import { CreatureTypeApi } from "../../../domain/types/creatureType.types";

export default class GetCreatureTypesBySystem {
  constructor(private readonly creatureTypeService: CreatureTypeService) {}

  execute(rulesets: string[], userId?: string): Promise<CreatureTypeApi[]> {
    return this.creatureTypeService.getBySystems(rulesets, userId);
  }
}
