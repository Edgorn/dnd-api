import { RasgoApi } from "../types";

export default class IRasgoRepository {
  obtenerRasgosPorIndices(params: string[]): RasgoApi[] {
    throw new Error('Método no implementado');
  }

  obtenerRasgoPorIndice(params: string): RasgoApi {
    throw new Error('Método no implementado');
  }
}
