import { RasgoApi, RasgoDataMongo, TraitsOptionsApi, TraitsOptionsMongo } from "../types/rasgos.types";

export default interface IRasgoRepository {
  obtenerRasgosPorIndices(params: string[], data?: RasgoDataMongo): Promise<RasgoApi[]>
  obtenerRasgosOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined>
}
