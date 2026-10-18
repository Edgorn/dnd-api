import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CharacterClassDetailApi, InputCreateCharacterClass } from "../../../domain/types/characterClass.types";
import GetCharacterClassById from "./getCharacterClassById.use-case";

export default class CreateCharacterClass {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly systemService: SystemService,
    private readonly getCharacterClassById: GetCharacterClassById
  ) { }

  async execute(data: InputCreateCharacterClass, userId: string): Promise<CharacterClassDetailApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear clases en este sistema", 403);
    }

    const saved = await this.characterClassService.create(data);
    return this.getCharacterClassById.execute(saved.id);
  }
}
