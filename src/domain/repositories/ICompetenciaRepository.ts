import { CompetenciaApi } from "../types";

export default class ICompetenciaRepository {
  obtenerCompetenciasPorIndices(params: string[]): CompetenciaApi[] {
    throw new Error('Método no implementado');
  }

  obtenerCompetenciaPorIndice(params: string): CompetenciaApi {
    throw new Error('Método no implementado');
  }

  obtenerCompetenciasPorType(params: string): CompetenciaApi[] {
    throw new Error('Método no implementado');
  }
}
