import CampañaService from "../../../domain/services/campaña.service";
import { TypeEntradaCampaña } from "../../../domain/types/campañas.types";

export default class DenegarEntradaACampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(data: TypeEntradaCampaña): Promise<{ userId: string, campaignId: string } | null> {
    return this.campañaService.denegarSolicitud(data)
  }
}
