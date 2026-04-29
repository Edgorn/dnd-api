import RazaService from "../../../domain/services/raza.service";
import { RaceApi } from "../../../domain/types/razas.types";

export default class ObtenerTodasLasRazas {
  constructor(private readonly razaService: RazaService) { }

  execute(ruleset?: string): Promise<RaceApi[]> {
    if (ruleset) {
      return this.razaService.obtenerPorSistema(ruleset);
    }
    return this.razaService.obtenerTodas();
  }
}