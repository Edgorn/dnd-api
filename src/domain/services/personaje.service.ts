import IPersonajeRepository from "../repositories/IPersonajeRepository";

export default class PersonajeService {
  private personajeRepository: IPersonajeRepository;

  constructor(personajeRepository: IPersonajeRepository) {
    this.personajeRepository = personajeRepository;
  }

  async crearPersonaje(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.crear(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error al crear personaje' };
    }
  }

  async consultarPersonajes(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.consultarPersonajes(data);
      return { success: true, data: result };
      
    } catch (error) {
      return { success: false, message: 'Error al consultar personajes' };
    }
  }

  async consultarPersonaje(idUser: string, idCharacter: string): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.consultarPersonaje(idUser, idCharacter);
      return { success: true, data: result };
      
    } catch (error) {
      return { success: false, message: 'Error al consultar personaje' };
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
}
