import IRaceRepository from "../repositories/IRaceRepository";
import { CreateRace, RaceApi, RaceRef, UpdateRace } from "../types/race.types";

export default class RaceService {
  constructor(private readonly raceRepository: IRaceRepository) { }

  obtenerTodas(playable?: boolean): Promise<RaceApi[]> {
    return this.raceRepository.obtenerTodas(playable);
  }

  obtenerPorSistema(ruleset: string, playable?: boolean): Promise<RaceApi[]> {
    return this.raceRepository.obtenerPorSistema(ruleset, playable);
  }

  obtenerPorId(id: string): Promise<RaceApi | undefined> {
    return this.raceRepository.obtenerPorId(id);
  }

  crear(race: CreateRace): Promise<RaceApi> {
    return this.raceRepository.crear(race);
  }

  actualizar(race: UpdateRace): Promise<RaceApi | undefined> {
    return this.raceRepository.actualizar(race);
  }

  softDelete(id: string): Promise<boolean> {
    return this.raceRepository.softDelete(id);
  }

  restore(id: string): Promise<boolean> {
    return this.raceRepository.restore(id);
  }

  getRaceRefsByIds(ids: string[]): Promise<RaceRef[]> {
    return this.raceRepository.getRaceRefsByIds(ids);
  }
}
