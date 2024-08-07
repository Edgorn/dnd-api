import { IdiomaApi } from "../types";

export default class IIdiomaRepository {
  obtenerIdiomasPorIndices(params: string[]): IdiomaApi[] {
    throw new Error('Método no implementado');
  }

  obtenerIdiomaPorIndice(params: string): IdiomaApi {
    throw new Error('Método no implementado');
  }
}
