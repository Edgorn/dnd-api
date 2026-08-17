import ICoinRepository from "../../../domain/repositories/ICoinRepository";

export default class DeleteCoin {
  constructor(private readonly coinRepository: ICoinRepository) {}

  async execute(id: string): Promise<void> {
    await this.coinRepository.softDelete(id);
  }
}
