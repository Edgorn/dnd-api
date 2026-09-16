import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import CharacterClassService from "../../../domain/services/characterClass.service";
import { AppError } from "../../../domain/errors/AppError";
import { InputCreateSubclass, SubclassApi } from "../../../domain/types/subclass.types";
import { assertClassBelongsToSubclassRuleset } from "./assertClassBelongsToSubclassRuleset";

export default class CreateSubclass {
  constructor(
    private readonly subclassService: SubclassService,
    private readonly systemService: SystemService,
    private readonly characterClassService: CharacterClassService
  ) { }

  async execute(data: InputCreateSubclass, userId: string): Promise<SubclassApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear subclases en este sistema", 403);
    }

    await assertClassBelongsToSubclassRuleset(
      this.characterClassService,
      this.systemService,
      data.classId,
      data.ruleset
    );

    return this.subclassService.create(data);
  }
}
