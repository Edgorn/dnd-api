import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeSpendHitDice } from "../../../domain/types/personajes.types";

export default class SpendHitDice {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeSpendHitDice): Promise<PersonajeApi> {
    return this.personajeService.spendHitDice(data);
  }
}
