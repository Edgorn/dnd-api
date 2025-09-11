import IPersonajeRepository from "../repositories/IPersonajeRepository";
import { ClaseLevelUp } from "../types/clases.types";
import { ClaseLevelUpCharacter, PersonajeApi, PersonajeBasico, TypeAñadirEquipamiento, TypeCrearPersonaje, TypeEliminarEquipamiento, TypeEquiparArmadura, TypeSubirNivel } from "../types/personajes.types";

export default class PersonajeService {
  constructor(private readonly personajeRepository: IPersonajeRepository) {}

  consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    return this.personajeRepository.consultarPorUsuario(id);
  }

  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    return this.personajeRepository.crear(data);
  }

  consultarPersonaje(idCharacter: string, user: string): Promise<PersonajeApi> {
   return this.personajeRepository.consultarPorId(idCharacter, user);
  }

  obtenerPdf(idCharacter: string, user: string): Promise<any> {
    return this.personajeRepository.obtenerPdf(idCharacter, user);
  }

  añadirEquipamiento(data: TypeAñadirEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeRepository.añadirEquipamiento(data);
  }
  
  eliminarEquipamiento(data: TypeEliminarEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeRepository.eliminarEquipamiento(data);
  }

  equiparArmadura(data: TypeEquiparArmadura): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeRepository.equiparArmadura(data);
  }

  modificarDinero(id: string, money: number): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeRepository.modificarDinero(id, money);
  }

  cambiarXp({id, XP}: {id: string, XP: number}): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeRepository.cambiarXp({id, XP});
  }
  
  subirNivelDatos({ id, clase }: { id: string, clase: string }): Promise<ClaseLevelUpCharacter | null> {
    return this.personajeRepository.subirNivelDatos({ id, clase });
  }

  subirNivel(data: TypeSubirNivel): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null>  {
    return this.personajeRepository.subirNivel(data);
  }
}
