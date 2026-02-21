import CriaturaService from "../../../domain/services/criatura.service";
import { CriaturaApi } from "../../../domain/types/criaturas.types";

export default class ObtenerCriaturasPorTipos {
  constructor(private readonly criaturaService: CriaturaService) { }

  execute(types: string[]): Promise<CriaturaApi[]> {
    return this.criaturaService.obtenerPorTipos(types)
  }
}
