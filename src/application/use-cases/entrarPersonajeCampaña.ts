import CampañaService from "../../domain/services/campaña.service";

export default class EntrarPersonajeCampaña {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(idUser: string, idCharacter: string, idCampaign: string): Promise<any> {
    return await this.campañaService.entrarPersonajeCampaña(idUser, idCharacter, idCampaign)
  }
}
