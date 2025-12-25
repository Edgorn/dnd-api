import CampañaService from "../../../domain/services/campaña.service";
import { TypeEntradaPersonajeCampaña } from "../../../domain/types/campañas.types";

export default class AñadirPersonajeACampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(data: TypeEntradaPersonajeCampaña): Promise<{ characterId: string } | null> {
    return this.campañaService.añadirPersonaje(data)
  }
}
