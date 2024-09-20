import CampañaService from "../../domain/services/campaña.service";

export default class ConsultarCampañas {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(data: any): Promise<any> {
    return await this.campañaService.consultarCampañas(data)
  }
}
