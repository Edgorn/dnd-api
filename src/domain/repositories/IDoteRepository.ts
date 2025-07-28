import { DoteApi, DoteMongo } from "../types";

export default class IDoteRepository {
  async obtenerTodos(): Promise<DoteApi[]> {
    throw new Error('Método no implementado');
  }

  async obtenerDotesPorIndices(indices: string[]): Promise<DoteApi[]> {
    throw new Error('Método no implementado');
  }

  async obtenerDotePorIndice(index: string): Promise<DoteApi | null> {
    throw new Error('Método no implementado');
  }

  formatearDotes(dotes: DoteMongo[]): DoteApi[] {
    throw new Error('Método no implementado');
  }

  formatearDote(dote: DoteMongo): DoteApi {
    throw new Error('Método no implementado');
  }
}
