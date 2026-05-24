import RazaService from "../../../domain/services/raza.service";
import { CreateRace, RaceApi } from "../../../domain/types/razas.types";

export default class ActualizarRaza {
  constructor(private readonly razaService: RazaService) { }

  execute(race: CreateRace): Promise<RaceApi | undefined> {
    return this.razaService.actualizar(race);
  }
}