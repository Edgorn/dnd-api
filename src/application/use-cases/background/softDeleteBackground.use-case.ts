import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";

export default class SoftDeleteBackground {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  async execute(id: string): Promise<void> {
    await this.backgroundRepository.softDelete(id);
  }
}
