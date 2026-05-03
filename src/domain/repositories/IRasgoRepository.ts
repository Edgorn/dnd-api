import { RasgoApi, RasgoDataMongo, TraitsOptionsApi, TraitsOptionsMongo } from "../types/rasgos.types";

export default interface IRasgoRepository {
  obtenerPorSistemas(ruleset: string[]): Promise<RasgoApi[]>
  obtenerRasgosPorIndices(params: string[], data?: RasgoDataMongo): Promise<RasgoApi[]>
  obtenerRasgosOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined>
}
