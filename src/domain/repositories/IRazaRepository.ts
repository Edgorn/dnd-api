import { RaceApi } from "../types/razas.types";

export default interface IRazaRepository {
  obtenerTodas(): Promise<RaceApi[]>
}
