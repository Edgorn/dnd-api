import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CharacterClassApi, InputCreateCharacterClass } from "../../../domain/types/characterClass.types";

export default class CreateCharacterClass {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputCreateCharacterClass, userId: string): Promise<CharacterClassApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear clases en este sistema", 403);
    }

    return this.characterClassService.create(data);
  }
}
