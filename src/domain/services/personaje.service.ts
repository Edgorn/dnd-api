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
      return { success: false, message: 'Error crear personaje' };
    }
  }

  async consultarPersonajes(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.consultarPersonajes(data);
      return { success: true, data: result };
      
    } catch (error) {
      return { success: false, message: 'Error crear personaje' };
    }
  }

  async consultarPersonaje(idUser: string, idCharacter: string): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.personajeRepository.consultarPersonaje(idUser, idCharacter);
      return { success: true, data: result };
      
    } catch (error) {
      return { success: false, message: 'Error crear personaje' };
    }
  }
}
