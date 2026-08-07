import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import { BackgroundApi, InputUpdateBackground } from "../../../domain/types/background.types";

export default class UpdateBackground {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  async execute(data: InputUpdateBackground): Promise<BackgroundApi> {
    return this.backgroundRepository.update(data);
  }
}
