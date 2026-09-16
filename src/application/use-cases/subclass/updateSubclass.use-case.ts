import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import CharacterClassService from "../../../domain/services/characterClass.service";
import { AppError } from "../../../domain/errors/AppError";
import { InputUpdateSubclass, SubclassApi } from "../../../domain/types/subclass.types";
import { assertClassBelongsToSubclassRuleset } from "./assertClassBelongsToSubclassRuleset";

export default class UpdateSubclass {
  constructor(
    private readonly subclassService: SubclassService,
    private readonly systemService: SystemService,
    private readonly characterClassService: CharacterClassService
  ) { }

  async execute(data: InputUpdateSubclass, userId: string): Promise<SubclassApi> {
    const existing = await this.subclassService.getById(data.id);
    if (!existing) {
      throw new AppError("Subclase no encontrada", 404);
    }

    const system = await this.systemService.getById(existing.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para editar esta subclase", 403);
    }

    const nextRuleset = data.ruleset ?? existing.ruleset;
    const nextClassId = data.classId ?? existing.classId;

    if (data.ruleset && data.ruleset !== existing.ruleset) {
      const nextSystem = await this.systemService.getById(data.ruleset);
      if (!nextSystem) {
        throw new AppError("Sistema asociado no encontrado", 404);
      }
      if (nextSystem.publisher !== userId) {
        throw new AppError("No tienes permisos para mover esta subclase a ese sistema", 403);
      }
    }

    if (data.classId !== undefined || data.ruleset !== undefined) {
      await assertClassBelongsToSubclassRuleset(
        this.characterClassService,
        this.systemService,
        nextClassId,
        nextRuleset
      );
    }

    return this.subclassService.update(data);
  }
}
