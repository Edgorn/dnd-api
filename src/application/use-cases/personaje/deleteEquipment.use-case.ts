import PersonajeService from "../../../domain/services/personaje.service";
import { TypeDeleteEquipment, UpdateCharacterEquipmentResponse } from "../../../domain/types/personajes.types";

export default class DeleteEquipment {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.personajeService.deleteEquipment(data);
  }
}
