import CreatureService from "../../../domain/services/creature.service";
import { CreatureApi, CreatureListFilters } from "../../../domain/types/creature.types";

export default class GetCreaturesBySystems {
  constructor(private readonly creatureService: CreatureService) {}

  execute(rulesets: string[], filters?: CreatureListFilters, userId?: string): Promise<CreatureApi[]> {
    return this.creatureService.getBySystems(rulesets, filters, userId);
  }
}
