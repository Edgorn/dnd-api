import CampañaService from "../../domain/services/campaña.service";
import { CampañaBasica } from "../../domain/types/campañas";

export default class ConsultarCampañas {
  private campañaService: CampañaService

  constructor(campañaService: CampañaService) {
    this.campañaService = campañaService;
  }

  async execute(data: any): Promise<{success: boolean, data?: CampañaBasica[], message?: string}> {
    return await this.campañaService.consultarCampañas(data)
  }
}
