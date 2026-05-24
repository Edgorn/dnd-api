import { CreateRace, RaceApi, RaceLevelMongo } from "../types/razas.types";

export default interface IRazaRepository {
  obtenerTodas(): Promise<RaceApi[]>
  obtenerPorSistema(ruleset: string): Promise<RaceApi[]>
  crear(race: CreateRace): Promise<RaceApi>
  actualizar(race: CreateRace): Promise<RaceApi | undefined>
  dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined>
}
