import RasgoService from "../../../domain/services/rasgo.service";
import { RasgoApi } from "../../../domain/types/rasgos.types";

export default class ObtenerRasgosPorSistemas {
  constructor(private readonly rasgoService: RasgoService) { }

  execute(ruleset: string[]): Promise<RasgoApi[]> {
    return this.rasgoService.obtenerPorSistemas(ruleset);
  }
}