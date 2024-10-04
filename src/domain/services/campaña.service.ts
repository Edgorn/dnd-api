import ICampañaRepository from "../repositories/ICampañaRepository";

export default class CampañaService {
  private campañaRepository: ICampañaRepository;

  constructor(campañaRepository: ICampañaRepository) {
    this.campañaRepository = campañaRepository;
  }

  async crearCampaña(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.campañaRepository.crear(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error crear campaña' };
    }
  }
  
  async consultarCampañas(data: any): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.campañaRepository.consultarCampañas(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error consultar campañas' };
    }
  }
  
  async consultarCampaña(data: any, id: string | undefined): Promise<{success: boolean, data?: any, message?: string}> {
    try {
      const result = await this.campañaRepository.consultarCampaña(data, id);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error consultar campañas' };
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
}
