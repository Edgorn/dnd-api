import IProficiencyRepository from "../repositories/IProficiencyRepository";
import { ProficiencyApi } from "../types/proficiencies.types";
import { ChoiceApi, ChoiceMongo } from "../types";

export default class ProficiencyService {
  constructor(private readonly proficiencyRepository: IProficiencyRepository) {}

  async getProficienciesByIndices(indices: string[]): Promise<ProficiencyApi[]> {
    return this.proficiencyRepository.getProficienciesByIndices(indices);
  }

  async formatProficiencyChoices(choices: ChoiceMongo[] | undefined): Promise<ChoiceApi<ProficiencyApi>[]> {
    return this.proficiencyRepository.formatProficiencyChoices(choices);
  }

  async getProficiencyById(id: string): Promise<ProficiencyApi | null> {
    return this.proficiencyRepository.getProficiencyById(id);
  }

  async getProficienciesBySystems(systems: string[]): Promise<ProficiencyApi[]> {
    return this.proficiencyRepository.getProficienciesBySystems(systems);
  }

  async createProficiency(proficiency: Omit<ProficiencyApi, "id" | "deletedAt">): Promise<ProficiencyApi> {
    return this.proficiencyRepository.createProficiency(proficiency);
  }

  async updateProficiency(id: string, proficiency: Partial<Omit<ProficiencyApi, "id" | "deletedAt">>): Promise<ProficiencyApi | null> {
    return this.proficiencyRepository.updateProficiency(id, proficiency);
  }

  async softDeleteProficiency(id: string): Promise<ProficiencyApi | null> {
    return this.proficiencyRepository.softDeleteProficiency(id);
  }

  async restoreProficiency(id: string): Promise<ProficiencyApi | null> {
    return this.proficiencyRepository.restoreProficiency(id);
  }
}
