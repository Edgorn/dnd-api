import CampañaService from "../../../domain/services/campaña.service";
import { CampañaBasica } from "../../../domain/types/campañas.types";

export default class GetCampaignsByUser {
  constructor(private readonly campañaService: CampañaService) { }

  execute(id: string): Promise<CampañaBasica[]> {
    return this.campañaService.consultarPorUsuario(id)
  }
}
