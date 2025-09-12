import CampañaService from "../../../domain/services/campaña.service";
import { CampañaApi, CampañaBasica, TypeEntradaCampaña } from "../../../domain/types/campañas.types";

export default class DenegarEntradaACampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(data: TypeEntradaCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica} | null> {
    return this.campañaService.denegarSolicitud(data)
  }
}
