import CampañaService from "../../domain/services/campaña.service";

export default class ConsultarCampaña {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(idUser: string, idCampaign: string): Promise<any> {
    return await this.campañaService.consultarCampaña(idUser, idCampaign)
  }
}
