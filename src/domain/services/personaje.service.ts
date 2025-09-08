import IPersonajeRepository from "../repositories/IPersonajeRepository";
import { PersonajeApi, PersonajeBasico, TypeAñadirEquipamiento, TypeCrearPersonaje } from "../types/personajes";

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

  /**------------------------- */
 
  async cambiarXp(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.cambiarXp(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error al crear personaje' };
    }
  }
  
  async subirNivelDatos(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.subirNivelDatos(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error al subir de nivel' };
    }
  }
  
  async subirNivel(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.subirNivel(data);
      return { success: true, data: result };
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error al subir de nivel' };
    }
  }

  async eliminarEquipamiento(data: any) {
    try {
      const result = await this.personajeRepository.eliminarEquipamiento(data);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: 'Error al añadir equipamiento' };
    }
  }

  async equiparArmadura(data: any) {
    try {
      const result = await this.personajeRepository.equiparArmadura(data);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: 'Error al añadir equipamiento' };
    }
  }

  async updateMoney(id: string, money: number) {
    try {
      const result = await this.personajeRepository.updateMoney(id, money);

      if (result) {
        return { success: true };
      } else {
        return { success: false, message: 'Error al modificar dinero' };
      }

    } catch (error) {
      return { success: false, message: 'Error al modificar dinero' };
    }
  }
}
