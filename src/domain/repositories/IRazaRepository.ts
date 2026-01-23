import { RaceApi, RaceLevelMongo } from "../types/razas.types";

export default interface IRazaRepository {
  obtenerTodas(): Promise<RaceApi[]>
  dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined>
}
