import { HabilidadApi } from "../types";

export default class IHabilidadRepository {
  obtenerHabilidadesPorIndices(params: string[]): HabilidadApi[] {
    throw new Error('Método no implementado');
  }

  obtenerHabilidadPorIndice(params: string): HabilidadApi {
    throw new Error('Método no implementado');
  }

  obtenerHabilidades(): HabilidadApi[] {
    throw new Error('Método no implementado');
  }
}
