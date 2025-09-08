import { EstadoApi } from "../types/estados.types";

export default interface IEstadoRepository {
  obtenerEstadosPorIndices(params: string[]): Promise<EstadoApi[]>
}
