import IConjuroRepository from "../repositories/IConjuroRepository";
import { ConjuroApi } from "../types/conjuros.types";

export default class ConjuroService {
  constructor(private readonly conjuroRepository: IConjuroRepository) { }

  obtenerConjurosPorNivel(nivel: number): Promise<ConjuroApi[]> {
    return this.conjuroRepository.obtenerConjurosPorNivelClase(nivel)
  }

  obtenerConjurosRituales(): Promise<ConjuroApi[]> {
    return this.conjuroRepository.obtenerConjurosRituales()
  }
}