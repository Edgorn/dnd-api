import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteCharacterClass {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly systemService: SystemService
  ) { }

  async execute(id: string, userId: string): Promise<void> {
    const existingClass = await this.characterClassService.getById(id);
    if (!existingClass) {
      throw new AppError("Clase no encontrada", 404);
    }

    const system = await this.systemService.getById(existingClass.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar clases en este sistema", 403);
    }

    await this.characterClassService.softDelete(id);
  }
}
