import { ChoiceApi, ChoiceMongo } from "../types"
import { CrearIdioma, IdiomaApi } from "../types/idiomas.types"

export default interface IIdiomaRepository {
  obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]>
  formatearOpcionesDeIdioma(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<IdiomaApi> | undefined>
  obtenerIdiomasPorSistemas(ruleset: string[]): Promise<IdiomaApi[]>
  crearIdioma(idioma: CrearIdioma): Promise<IdiomaApi>
  modificarIdioma(idioma: CrearIdioma): Promise<IdiomaApi>
}
