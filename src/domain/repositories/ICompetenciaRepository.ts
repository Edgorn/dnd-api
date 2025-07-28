import { CompetenciaApi } from "../types";

export default class ICompetenciaRepository {
  async obtenerCompetenciasPorIndices(params: string[]): Promise<CompetenciaApi[]> {
    throw new Error('Método no implementado');
  }

  async obtenerCompetenciaPorIndice(params: string): Promise<CompetenciaApi | null> {
    throw new Error('Método no implementado');
  }

  async obtenerCompetenciasPorType(params: string): Promise<CompetenciaApi[]> {
    throw new Error('Método no implementado');
  }
}
