import CampañaService from "../../../domain/services/campaña.service";
import { CampañaBasica } from "../../../domain/types/campañas.types";

export default class SolicitarEntradaACampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(idUser: string, idCampaign: string): Promise<CampañaBasica | null> {
    return this.campañaService.registrarSolicitud(idUser, idCampaign)
  }
}
