import ConjuroService from "../../../domain/services/conjuro.service";
import { ConjuroApi } from "../../../domain/types/conjuros.types";

export default class ObtenerConjurosRituales {
  constructor(private readonly conjuroService: ConjuroService) { }

  execute(): Promise<ConjuroApi[]> {
    return this.conjuroService.obtenerConjurosRituales()
  }
}