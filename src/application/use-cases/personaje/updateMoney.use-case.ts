import PersonajeService from "../../../domain/services/personaje.service";
import { UpdateCharacterMoneyResponse } from "../../../domain/types/personajes.types";

export default class UpdateMoney {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    return this.personajeService.updateMoney(id, money);
  }
}
