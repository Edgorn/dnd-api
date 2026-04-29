import { CreateRace, RaceApi, RaceLevelMongo } from "../types/razas.types";

export default interface IRazaRepository {
  obtenerTodas(): Promise<RaceApi[]>
  obtenerPorSistema(ruleset: string): Promise<RaceApi[]>
  crear(race: CreateRace): Promise<any>
  dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined>
}
