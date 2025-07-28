import { ConjuroApi } from "../types";

export default class IConjuroRepository {
  /*init(): any {
    throw new Error('Método no implementado');
  }

  cargar(): any {
    throw new Error('Método no implementado');
  }*/

  async obtenerConjurosPorIndices(params: string[]): Promise<ConjuroApi[]> {
    throw new Error('Método no implementado');
  }

  async obtenerConjuroPorIndice(params: string):  Promise<ConjuroApi | null> {
    throw new Error('Método no implementado');
  }

  async obtenerConjurosPorNivelClase(nivel: string, clase: string): Promise<ConjuroApi[]> {
    throw new Error('Método no implementado');
  }
}
