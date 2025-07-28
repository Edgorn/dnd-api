import { RasgoApi, RasgoDataMongo, RasgoMongo } from "../types";

export default class IRasgoRepository {
  async obtenerRasgoPorIndice(params: string, data?: RasgoDataMongo): Promise<RasgoApi | null> {
    throw new Error('Método no implementado');
  }

  async obtenerRasgosPorIndices(params: string[], data?: RasgoDataMongo): Promise<RasgoApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearRasgo(params: RasgoMongo, data?: RasgoDataMongo): Promise<RasgoApi> {
    throw new Error('Método no implementado');
  }
}
