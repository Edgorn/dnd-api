import CampañaService from "../../../domain/services/campaña.service";
import { CampañaBasica, TypeCrearCampaña } from "../../../domain/types/campañas.types";

export default class CrearCampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(data: TypeCrearCampaña): Promise<CampañaBasica | null> {
    return this.campañaService.crear(data)
  }
}
