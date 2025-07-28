import { TypeCrearPersonaje, PersonajeBasico, PersonajeMongo } from "../types/personajes";

export default class IPersonajeRepository {
  async crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    throw new Error('Método no implementado');
  }

  async consultarPersonajesUser(id: string): Promise<PersonajeBasico[]> {
    throw new Error('Método no implementado');
  }

  async formatearPersonajes(personajes: PersonajeMongo[]): Promise<PersonajeBasico[]> {
    throw new Error('Método no implementado');
  }

  async formatearPersonajeBasico(personaje: PersonajeMongo): Promise<PersonajeBasico | null> {
    throw new Error('Método no implementado');
  }

  async calcularCA(personaje: PersonajeMongo): Promise<{CA: number, plusSpeed: number}> {
    throw new Error('Método no implementado');
  }

  async consultarPersonajes(indexList: string[]): Promise<PersonajeBasico[]> {
    throw new Error('Método no implementado');
  }

  async consultarPersonajeBasico(id: string): Promise<PersonajeBasico | null> {
    throw new Error('Método no implementado')
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

  async crearPdf(idUser: string, idCharacter: string): Promise<any> {
    throw new Error('Método no implementado');
  }

  async entrarPersonajeCampaña(idUser: string, idCharacter: string, idCampaign: string): Promise<PersonajeBasico | null> {
    throw new Error('Método no implementado');
  }
}
