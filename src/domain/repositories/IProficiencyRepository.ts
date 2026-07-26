import { ChoiceApi, ChoiceMongo } from "../types";
import { ProficiencyApi } from "../types/proficiencies.types";

export default interface IProficiencyRepository {
  getProficienciesByIndices(indices: string[]): Promise<ProficiencyApi[]>;
  formatProficiencyChoices(choices: ChoiceMongo[] | undefined): Promise<ChoiceApi<ProficiencyApi>[]>;
  getProficiencyById(id: string): Promise<ProficiencyApi | null>;
  getProficienciesBySystems(systems: string[]): Promise<ProficiencyApi[]>;
  createProficiency(proficiency: Omit<ProficiencyApi, "id" | "deletedAt">): Promise<ProficiencyApi>;
  updateProficiency(id: string, proficiency: Partial<Omit<ProficiencyApi, "id" | "deletedAt">>): Promise<ProficiencyApi | null>;
  softDeleteProficiency(id: string): Promise<ProficiencyApi | null>;
  restoreProficiency(id: string): Promise<ProficiencyApi | null>;
}
