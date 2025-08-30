import IPersonajeRepository from "../repositories/IPersonajeRepository";
import { PersonajeBasico, TypeCrearPersonaje } from "../types/personajes";

export default class PersonajeService {
  constructor(private readonly personajeRepository: IPersonajeRepository) {}

  consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    return this.personajeRepository.consultarPorUsuario(id);
  }

  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    return this.personajeRepository.crear(data);
  }






  async consultarPersonaje(idUser: string, idCharacter: string): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.consultarPersonaje(idUser, idCharacter);
      return { success: true, data: result };
      
    } catch (error: any) {
      console.error(error)
      return { success: false, message: error?.message ?? 'Error al consultar personaje' };
    }
  }
 
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

  async añadirEquipamiento(data: any) {
    try {
      const result = await this.personajeRepository.añadirEquipamiento(data);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: 'Error al añadir equipamiento' };
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

  async crearPdf(idUser: string, idCharacter: string): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.crearPdf(idUser, idCharacter);
      return { success: true, data: result };
      
    } catch (error) {
      return { success: false, message: 'Error al generar pdf' };
    }
  }
}
