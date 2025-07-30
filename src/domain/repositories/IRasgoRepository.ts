import { RasgoApi, RasgoDataMongo, RasgoMongo } from "../types";
import { TraitsOptionsApi, TraitsOptionsMongo } from "../types/rasgos";

export default class IRasgoRepository {
  async obtenerRasgoPorIndice(params: string, data?: RasgoDataMongo): Promise<RasgoApi | null> {
    throw new Error('Método no implementado');
  }

  async obtenerRasgosPorIndices(params: string[], data?: RasgoDataMongo): Promise<RasgoApi[]> {
    throw new Error('Método no implementado');
  }

  async formatearTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined> {
    throw new Error('Método no implementado');
  }

  async formatearRasgo(params: RasgoMongo, data?: RasgoDataMongo): Promise<RasgoApi> {
    throw new Error('Método no implementado');
  }
}
