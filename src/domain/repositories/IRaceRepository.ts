import { CreateRace, RaceApi, RaceLevelMongo, RaceRef, UpdateRace } from "../types/race.types";
import { AttributeApi } from "../types/attribute.types";

export default interface IRaceRepository {
  obtenerTodas(playable?: boolean): Promise<RaceApi[]>
  obtenerPorSistema(ruleset: string, playable?: boolean): Promise<RaceApi[]>
  obtenerPorId(id: string): Promise<RaceApi | undefined>
  crear(race: CreateRace): Promise<RaceApi>
  actualizar(race: UpdateRace): Promise<RaceApi | undefined>
  dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined>
  getSpellcastingAttribute(raceId: string): Promise<AttributeApi | undefined>
  softDelete(id: string): Promise<boolean>
  restore(id: string): Promise<boolean>
  getRaceRefsByIds(ids: string[]): Promise<RaceRef[]>
  getRaceRefsBySystems(rulesets: string[]): Promise<RaceRef[]>
}
