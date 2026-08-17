import ICoinRepository from "../../../domain/repositories/ICoinRepository";

export default class RestoreCoin {
  constructor(private readonly coinRepository: ICoinRepository) {}

  async execute(id: string): Promise<void> {
    await this.coinRepository.restore(id);
  }
}
