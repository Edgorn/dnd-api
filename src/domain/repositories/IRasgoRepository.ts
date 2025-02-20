import { RasgoApi } from "../types";

export default class IRasgoRepository {
  async cargar() {
    throw new Error('Método no implementado');
  }

  obtenerRasgosPorIndices(params: string[]): RasgoApi[] {
    throw new Error('Método no implementado');
  }

  obtenerRasgoPorIndice(params: string): RasgoApi {
    throw new Error('Método no implementado');
  }
}
