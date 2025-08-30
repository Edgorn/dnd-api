import { TypeCrearPersonaje, PersonajeBasico, PersonajeMongo } from "../types/personajes";

export default interface IPersonajeRepository {
  consultarPorUsuario(id: string): Promise<PersonajeBasico[]> 
  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> 
  /*
  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> 

   consultarPersonajesUser(id: string): Promise<PersonajeBasico[]> 

   formatearPersonajes(personajes: PersonajeMongo[]): Promise<PersonajeBasico[]> 

   formatearPersonajeBasico(personaje: PersonajeMongo): Promise<PersonajeBasico | null> 

   calcularCA(personaje: PersonajeMongo): Promise<{CA: number, plusSpeed: number}> 

   consultarPersonajes(indexList: string[]): Promise<PersonajeBasico[]> 

   consultarPersonajeBasico(id: string): Promise<PersonajeBasico | null> 

   consultarPersonaje(idUser: string, idCharacter: string): Promise<any> 

   cambiarXp(data: any): Promise<any> 

   subirNivelDatos(data: any): Promise<any> 

   subirNivel(data: any): Promise<any> 

   añadirEquipamiento(data: any): Promise<any> 

   eliminarEquipamiento(data: any): Promise<any> 

   equiparArmadura(data: any): Promise<any> 

   updateMoney(id: string, money: number): Promise<boolean> 

   crearPdf(idUser: string, idCharacter: string): Promise<any> 

   entrarPersonajeCampaña(idUser: string, idCharacter: string, idCampaign: string): Promise<PersonajeBasico | null> */
}
