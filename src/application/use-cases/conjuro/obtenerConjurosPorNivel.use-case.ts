import ConjuroService from "../../../domain/services/conjuro.service";
import { ConjuroApi } from "../../../domain/types/conjuros.types";

export default class ObtenerConjurosPorNivel {
  constructor(private readonly conjuroService: ConjuroService) { }

  execute(nivel: number): Promise<ConjuroApi[]> {
    return this.conjuroService.obtenerConjurosPorNivel(nivel)
  }
}