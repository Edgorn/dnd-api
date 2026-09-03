import PersonajeService from "../../../domain/services/personaje.service";
import { TypeAddEquipment, UpdateCharacterEquipmentResponse } from "../../../domain/types/personajes.types";

export default class AddEquipment {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.personajeService.addEquipment(data);
  }
}
