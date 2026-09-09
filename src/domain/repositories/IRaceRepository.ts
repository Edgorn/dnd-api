import { CreateRace, RaceApi, RaceLevelMongo, UpdateRace } from "../types/race.types";
import { AttributeApi } from "../types/attribute.types";

export default interface IRaceRepository {
  obtenerTodas(): Promise<RaceApi[]>
  obtenerPorSistema(ruleset: string): Promise<RaceApi[]>
  obtenerPorId(id: string): Promise<RaceApi | undefined>
  crear(race: CreateRace): Promise<RaceApi>
  actualizar(race: UpdateRace): Promise<RaceApi | undefined>
  dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined>
  getSpellcastingAttribute(raceId: string): Promise<AttributeApi | undefined>
  softDelete(id: string): Promise<boolean>
  restore(id: string): Promise<boolean>
}
