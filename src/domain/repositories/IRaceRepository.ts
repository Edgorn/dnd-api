import { CreateRace, RaceApi, RaceLevelMongo } from "../types/race.types";

export default interface IRaceRepository {
  obtenerTodas(): Promise<RaceApi[]>
  obtenerPorSistema(ruleset: string): Promise<RaceApi[]>
  obtenerPorId(id: string): Promise<RaceApi | undefined>
  crear(race: CreateRace): Promise<RaceApi>
  actualizar(race: CreateRace): Promise<RaceApi | undefined>
  dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined>
  softDelete(id: string): Promise<boolean>
  restore(id: string): Promise<boolean>
}
