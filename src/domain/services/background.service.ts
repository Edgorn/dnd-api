import IBackgroundRepository from "../repositories/IBackgroundRepository";
import { BackgroundApi } from "../types/background.types";

export default class BackgroundService {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<BackgroundApi[]> {
    return this.backgroundRepository.getBySystems(rulesets, includeDeleted);
  }
}
