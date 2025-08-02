import { ChoiceApi, ChoiceMongo } from "../types";
import { CompetenciaApi } from "../types/competencias.types";

export default interface ICompetenciaRepository {
  obtenerCompetenciasPorIndices(indices: string[]): Promise<CompetenciaApi[]>
  formatearOpcionesDeCompetencias(opciones: ChoiceMongo[] | undefined): Promise<ChoiceApi<CompetenciaApi>[]>
  obtenerCompetenciaPorIndice(indice: string): Promise<CompetenciaApi | null>
}