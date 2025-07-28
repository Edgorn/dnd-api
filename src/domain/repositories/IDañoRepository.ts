import { DañoApi } from "../types";

export default class IDañoRepository {
  async obtenerDañosPorIndices(params: string[]): Promise<DañoApi[]> {
    throw new Error('Método no implementado');
  }

  async obtenerDañoPorIndice(params: string): Promise<DañoApi | null> {
    throw new Error('Método no implementado');
  }
}
