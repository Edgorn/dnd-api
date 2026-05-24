import IdiomaService from "../../../domain/services/idioma.service";
import { IdiomaApi } from "../../../domain/types/idiomas.types";

export default class ObtenerIdiomasPorSistemas {
  constructor(private readonly idiomaService: IdiomaService) { }

  execute(ruleset: string[]): Promise<IdiomaApi[]> {
    return this.idiomaService.obtenerPorSistemas(ruleset);
  }
}