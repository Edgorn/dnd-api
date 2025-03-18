import { CampañaBasica } from "../types/campañas";

export default class ICampañaRepository {
  async crear(data: any): Promise<CampañaBasica> {
    throw new Error('Método no implementado');
  }

  async consultarCampañas(data: any): Promise<CampañaBasica[]> {
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
  }
}
