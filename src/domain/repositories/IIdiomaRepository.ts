import { IdiomaApi } from "../types";

export default interface IIdiomaRepository {
  obtenerTodos(): Promise<IdiomaApi[]>
  obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]>
}
