import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeEquipEquipment } from "../../../domain/types/personajes.types";

export default class EquipEquipment {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeEquipEquipment): Promise<{ completo: PersonajeApi; basico: PersonajeBasico }> {
    return this.personajeService.equipEquipment(data);
  }
}
