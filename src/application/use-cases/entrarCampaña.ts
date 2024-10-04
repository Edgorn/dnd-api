import CampañaService from "../../domain/services/campaña.service";

export default class EntrarCampaña {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(data: any, id: string | undefined): Promise<any> {
    return await this.campañaService.entrarCampaña(data, id)
  }
}
