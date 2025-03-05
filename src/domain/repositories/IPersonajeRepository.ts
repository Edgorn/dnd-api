import { PersonajeBasico } from "../types/personajes";

export default class IPersonajeRepository {
  async crear(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async consultarPersonajes(id: number): Promise<PersonajeBasico[]> {
    throw new Error('Método no implementado');
  }

  async consultarPersonaje(idUser: string, idCharacter: string): Promise<any> {
    throw new Error('Método no implementado');
  }

  async cambiarXp(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async subirNivelDatos(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async subirNivel(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async añadirEquipamiento(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async eliminarEquipamiento(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async equiparArmadura(data: any): Promise<any> {
    throw new Error('Método no implementado');
  }

  async updateMoney(id: string, money: number): Promise<boolean> {
    throw new Error('Método no implementado');
  }

  async crearPdf(idUser: number, idCharacter: string): Promise<any> {
    throw new Error('Método no implementado');
  }
}
