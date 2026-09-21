import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import { BackgroundApi, InputUpdateBackground } from "../../../domain/types/background.types";
import { NotFoundError } from "../../../domain/errors/AppError";
import { assertValidBackgroundParent } from "./assertValidBackgroundParent";

export default class UpdateBackground {
  constructor(
    private readonly backgroundRepository: IBackgroundRepository,
    private readonly systemRepository: ISystemRepository
  ) { }

  async execute(data: InputUpdateBackground): Promise<BackgroundApi> {
    const existing = await this.backgroundRepository.getById(data.id);
    if (!existing) {
      throw new NotFoundError(`No se encontró el trasfondo con id: ${data.id}`);
    }

    const parentId = data.parentId !== undefined ? data.parentId : existing.parentId;
    const ruleset = data.ruleset ?? existing.ruleset;

    if (parentId) {
      await assertValidBackgroundParent(
        this.backgroundRepository,
        this.systemRepository,
        parentId,
        ruleset
      );
    }

    return this.backgroundRepository.update(data);
  }
}
