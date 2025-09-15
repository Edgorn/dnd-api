import CriaturaService from "../../../domain/services/criatura.service";
import { CriaturaApi } from "../../../domain/types/criaturas.types";

export default class ObtenerTodasLasCriaturas {
  constructor(private readonly criaturaService: CriaturaService) { }

  execute(): Promise<CriaturaApi[]> {
    return this.criaturaService.obtenerTodas()
  }
}
