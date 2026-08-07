import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import { BackgroundApi, InputCreateBackground } from "../../../domain/types/background.types";

export default class CreateBackground {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  async execute(data: InputCreateBackground): Promise<BackgroundApi> {
    return this.backgroundRepository.create(data);
  }
}
