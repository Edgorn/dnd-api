import { IdiomaApi } from "../types/idiomas.types"

export default interface IIdiomaRepository {
  obtenerTodos(): Promise<IdiomaApi[]>
  obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]>
}
