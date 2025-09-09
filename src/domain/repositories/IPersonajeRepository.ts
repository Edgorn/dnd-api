import { TypeCrearPersonaje, PersonajeBasico, PersonajeApi, TypeAñadirEquipamiento, TypeEliminarEquipamiento, TypeEquiparArmadura } from "../types/personajes.types";

export default interface IPersonajeRepository {
  consultarPorUsuario(id: string): Promise<PersonajeBasico[]> 
  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> 
  consultarPorId(idCharacter: string, user: string): Promise<PersonajeApi>
  obtenerPdf(idCharacter: string, user: string): Promise<any> 
  añadirEquipamiento(data: TypeAñadirEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> 
  eliminarEquipamiento(data: TypeEliminarEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> 
  equiparArmadura(data: TypeEquiparArmadura): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> 
  modificarDinero(id: string, money: number): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> 

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
