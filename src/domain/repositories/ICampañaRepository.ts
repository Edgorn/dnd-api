import { CampañaApi, CampañaBasica, TypeCrearCampaña, TypeEntradaCampaña, TypeEntradaPersonajeCampaña } from "../types/campañas.types";
import { PersonajeBasico } from "../types/personajes.types";

export default interface ICampañaRepository {
  consultarPorUsuario(id: string): Promise<CampañaBasica[]>
  crear(data: TypeCrearCampaña): Promise<CampañaBasica | null>
  consultarPorId(idUser: string, idCampaign: string): Promise<CampañaApi | null>
  registrarSolicitud(idUser: string, idCampaign: string): Promise<CampañaBasica | null>
  denegarSolicitud(data: TypeEntradaCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica} | null>
  aceptarSolicitud(data: TypeEntradaCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica} | null>
  añadirPersonaje(data: TypeEntradaPersonajeCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica, personaje: PersonajeBasico} | null>
  /*
  async crear(data: any): Promise<CampañaBasica> {
    throw new Error('Método no implementado');
  }

  async consultarCampaña(data: any, id: string | undefined): Promise<any> {
    throw new Error('Método no implementado');
  }

  async entrarCampaña(data: any, id: string | undefined): Promise<any> {
    throw new Error('Método no implementado');
  }

  async aceptarUsuarioCampaña(idMaster: string, idUser: string, idChampaign: string): Promise<any> {
    throw new Error('Método no implementado');
  }

  async denegarUsuarioCampaña(idMaster: string, idUser: string, idChampaign: string): Promise<any> {
    throw new Error('Método no implementado');
  }

  async entrarPersonajeCampaña(idUser: string, idCharacter: string, idChampaign: string): Promise<any> {
    throw new Error('Método no implementado');
  }
  
  async nombreCampaña(idCampaign: string): Promise<string> {
    throw new Error('Método no implementado');
  }*/
}
