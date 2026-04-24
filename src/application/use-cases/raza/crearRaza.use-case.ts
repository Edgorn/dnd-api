import RazaService from "../../../domain/services/raza.service";
import { CreateRace, RaceApi } from "../../../domain/types/razas.types";

export default class CrearRaza {
  constructor(private readonly razaService: RazaService) { }

  execute(race: CreateRace): Promise<RaceApi> {
    return this.razaService.crear(race);
  }
}