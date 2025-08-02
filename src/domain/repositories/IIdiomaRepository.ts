import { ChoiceApi, ChoiceMongo } from "../types"
import { IdiomaApi } from "../types/idiomas.types"

export default interface IIdiomaRepository {
  obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]>
  formatearOpcionesDeIdioma(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<IdiomaApi> | undefined>
}
