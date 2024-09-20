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
      const result = await this.campañaRepository.consultar(data);
      return { success: true, data: result };
      
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error consultar campañas' };
    }
  }
}
