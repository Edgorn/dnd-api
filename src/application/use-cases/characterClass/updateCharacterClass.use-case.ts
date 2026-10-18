import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CharacterClassDetailApi, InputUpdateCharacterClass } from "../../../domain/types/characterClass.types";
import GetCharacterClassById from "./getCharacterClassById.use-case";

export default class UpdateCharacterClass {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly systemService: SystemService,
    private readonly getCharacterClassById: GetCharacterClassById
  ) { }

  async execute(data: InputUpdateCharacterClass, userId: string): Promise<CharacterClassDetailApi> {
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

    await this.characterClassService.update(data);
    return this.getCharacterClassById.execute(data.id);
  }
}
