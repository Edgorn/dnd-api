import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";

export default class RestoreBackground {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  async execute(id: string): Promise<void> {
    await this.backgroundRepository.restore(id);
  }
}
