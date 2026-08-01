import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CharacterClassApi, InputUpdateCharacterClass } from "../../../domain/types/characterClass.types";

export default class UpdateCharacterClass {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputUpdateCharacterClass, userId: string): Promise<CharacterClassApi> {
    const existingClass = await this.characterClassService.getById(data.id);
    if (!existingClass) {
      throw new AppError("Clase no encontrada", 404);
    }

    const system = await this.systemService.getById(existingClass.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para editar clases en este sistema", 403);
    }

    return this.characterClassService.update(data);
  }
}
