import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeBindPactEquipment } from "../../../domain/types/personajes.types";

export default class BindPactEquipment {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeBindPactEquipment): Promise<{ completo: PersonajeApi; basico: PersonajeBasico }> {
    return this.personajeService.bindPactEquipment(data);
  }
}
