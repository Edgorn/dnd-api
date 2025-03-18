import ICampañaRepository from "../repositories/ICampañaRepository";
import { CampañaBasica } from "../types/campañas";

export default class CampañaService {
  private campañaRepository: ICampañaRepository;

  constructor(campañaRepository: ICampañaRepository) {
    this.campañaRepository = campañaRepository;
  }

  async crearCampaña(data: any): Promise<{success: boolean, data?: CampañaBasica, message?: string}> {
    try {
      const result = await this.campañaRepository.crear(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error crear campaña' };
    }
  }
  
  async consultarCampañas(data: any): Promise<{success: boolean, data?: CampañaBasica[], message?: string}> {
    try {
      const result = await this.campañaRepository.consultarCampañas(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error consultar campañas' };
    }
  }
  
  async consultarCampaña(idUser: string, idCampaign: string): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.campañaRepository.consultarCampaña(idUser, idCampaign);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message:(error as Error)?.message || 'Error al consultar campañas' };
    }
  }
  
  async entrarCampaña(data: any, id: string | undefined): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.campañaRepository.entrarCampaña(data, id);
      return { success: true, data: result };
      
    } catch (error: any) {
      return { success: false, message: error.message || 'Error inesperado' };
    }
  }

  async aceptarUsuarioCampaña(idMaster: string, idUser: string, idCampaign: string): Promise<any> {
    try {
      const result = await this.campañaRepository.aceptarUsuarioCampaña(idMaster, idUser, idCampaign);
      return { success: true, data: result };
      
    } catch (error: any) {
      return { success: false, message: error.message || 'Error inesperado' };
    }
  }

  async denegarUsuarioCampaña(idMaster: string, idUser: string, idCampaign: string): Promise<any> {
    try {
      const result = await this.campañaRepository.denegarUsuarioCampaña(idMaster, idUser, idCampaign);
      return { success: true, data: result };
      
    } catch (error: any) {
      return { success: false, message: error.message || 'Error inesperado' };
    }
  }

  async entrarPersonajeCampaña(idUser: string, idCharacter: string, idCampaign: string): Promise<any> {
    try {
      const result = await this.campañaRepository.entrarPersonajeCampaña(idUser, idCharacter, idCampaign);
      return { success: true, data: result };
      
    } catch (error: any) {
      return { success: false, message: error.message || 'Error inesperado' };
    }
    //return await this.campañaService.entrarCampaña(data, id)
  }
}
