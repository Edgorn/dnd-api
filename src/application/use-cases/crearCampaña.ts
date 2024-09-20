import CampañaService from "../../domain/services/campaña.service";

export default class CrearCampaña {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(data: any): Promise<any> {
    return await this.campañaService.crearCampaña(data)
  }
}
