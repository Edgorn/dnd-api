import CampañaService from "../../../domain/services/campaña.service";
import { TypeModificarLocalizaciones } from "../../../domain/types/campañas.types";

export default class ModificarLocalizacionesCampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(data: TypeModificarLocalizaciones): Promise<boolean> {
    return this.campañaService.modificarLocalizaciones(data)
  }
}
