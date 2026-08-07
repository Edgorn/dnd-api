import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import { BackgroundApi } from "../../../domain/types/background.types";

export default class GetBackgroundsBySystems {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  async execute(rulesets: string[], includeDeleted: boolean = false): Promise<BackgroundApi[]> {
    return this.backgroundRepository.getBySystems(rulesets, includeDeleted);
  }
}
