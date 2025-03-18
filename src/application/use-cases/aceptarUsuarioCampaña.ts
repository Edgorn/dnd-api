import CampañaService from "../../domain/services/campaña.service";

export default class AceptarUsuarioCampaña {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(idMaster: string, idUser: string, idCampaign: string): Promise<any> {
    return await this.campañaService.aceptarUsuarioCampaña(idMaster, idUser, idCampaign)
  }
}
