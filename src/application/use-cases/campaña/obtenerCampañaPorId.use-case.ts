import CampañaService from "../../../domain/services/campaña.service";
import { CampañaApi } from "../../../domain/types/campañas.types";

export default class ConsultarCampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(idUser: string, idCampaign: string): Promise<CampañaApi | null> {
    return this.campañaService.consultarPorId(idUser, idCampaign)
  }
}
