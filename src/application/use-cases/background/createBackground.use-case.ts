import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import { BackgroundApi, InputCreateBackground } from "../../../domain/types/background.types";
import { assertValidBackgroundParent } from "./assertValidBackgroundParent";

export default class CreateBackground {
  constructor(
    private readonly backgroundRepository: IBackgroundRepository,
    private readonly systemRepository: ISystemRepository
  ) { }

  async execute(data: InputCreateBackground): Promise<BackgroundApi> {
    if (data.parentId) {
      await assertValidBackgroundParent(
        this.backgroundRepository,
        this.systemRepository,
        data.parentId,
        data.ruleset
      );
    }

    return this.backgroundRepository.create(data);
  }
}
