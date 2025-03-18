import { IdiomaApi } from "../types";

export default class IIdiomaRepository {
  async init() {
    throw new Error('Método no implementado');
  }

  obtenerIdiomasPorIndices(params: string[]): IdiomaApi[] {
    throw new Error('Método no implementado');
  }

  obtenerIdiomaPorIndice(params: string): IdiomaApi {
    throw new Error('Método no implementado');
  }

  obtenerIdiomas(): IdiomaApi[] {
    throw new Error('Método no implementado');
  }
}
