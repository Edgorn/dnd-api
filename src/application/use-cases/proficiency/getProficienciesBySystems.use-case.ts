import ProficiencyService from "../../../domain/services/proficiency.service";
import { ProficiencyApi } from "../../../domain/types/proficiencies.types";

export default class GetProficienciesBySystems {
  constructor(private readonly proficiencyService: ProficiencyService) {}

  async execute(systems: string[]): Promise<ProficiencyApi[]> {
    return await this.proficiencyService.getProficienciesBySystems(systems);
  }
}
