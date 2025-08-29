import { DañoApi } from "../types";

export default interface IDañoRepository {
  obtenerDañosPorIndices(indices: string[]): Promise<DañoApi[]>
  obtenerDañoPorIndice(params: string): Promise<DañoApi | null>
}