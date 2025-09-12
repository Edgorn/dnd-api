import CampañaService from "../../../domain/services/campaña.service";
import { CampañaApi, CampañaBasica, TypeEntradaPersonajeCampaña } from "../../../domain/types/campañas.types";
import { PersonajeBasico } from "../../../domain/types/personajes.types";

export default class AñadirPersonajeACampaña {
  constructor(private readonly campañaService: CampañaService) { }

  execute(data: TypeEntradaPersonajeCampaña): Promise<{completo: CampañaApi, basico: CampañaBasica, personaje: PersonajeBasico} | null> {
    return this.campañaService.añadirPersonaje(data)
  }
}
