import { DañoApi } from "../types";

export default class IDañoRepository {
  obtenerDañosPorIndices(params: string[]): DañoApi[] {
    throw new Error('Método no implementado');
  }

  obtenerDañoPorIndice(params: string): DañoApi {
    throw new Error('Método no implementado');
  }
}
