import CreatureService from "../../../domain/services/creature.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreatureApi } from "../../../domain/types/creature.types";

export default class GetCreatureById {
  constructor(private readonly creatureService: CreatureService) {}

  async execute(id: string): Promise<CreatureApi> {
    const creature = await this.creatureService.getById(id);
    if (!creature || creature.deletedAt) {
      throw new AppError("Criatura no encontrada", 404);
    }
    return creature;
  }
}
