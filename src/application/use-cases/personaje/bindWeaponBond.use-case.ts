import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeBindWeaponBond } from "../../../domain/types/personajes.types";

export default class BindWeaponBond {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeBindWeaponBond): Promise<{ completo: PersonajeApi; basico: PersonajeBasico }> {
    return this.personajeService.bindWeaponBond(data);
  }
}
