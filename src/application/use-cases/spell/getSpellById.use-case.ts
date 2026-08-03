import SpellService from "../../../domain/services/spell.service";
import { SpellApi } from "../../../domain/types/spell.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GetSpellById {
  constructor(private readonly spellService: SpellService) { }

  async execute(id: string): Promise<SpellApi> {
    const spell = await this.spellService.getById(id);
    if (!spell) {
      throw new NotFoundError(`No se encontró el conjuro con ID: ${id}`);
    }
    return spell;
  }
}
