import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeSpendSpellSlot } from "../../../domain/types/personajes.types";

export default class SpendSpellSlot {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeSpendSpellSlot): Promise<PersonajeApi> {
    return this.personajeService.spendSpellSlot(data);
  }
}
