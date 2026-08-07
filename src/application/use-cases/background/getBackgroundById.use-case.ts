import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import { BackgroundApi } from "../../../domain/types/background.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GetBackgroundById {
  constructor(private readonly backgroundRepository: IBackgroundRepository) { }

  async execute(id: string): Promise<BackgroundApi> {
    const background = await this.backgroundRepository.getById(id);
    if (!background) {
      throw new NotFoundError(`No se encontró el trasfondo con id: ${id}`);
    }
    return background;
  }
}
