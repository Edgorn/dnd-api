import IRaceRepository from "../repositories/IRaceRepository";
import { CreateRace, RaceApi } from "../types/race.types";

export default class RaceService {
  constructor(private readonly raceRepository: IRaceRepository) { }

  obtenerTodas(): Promise<RaceApi[]> {
    return this.raceRepository.obtenerTodas();
  }

  obtenerPorSistema(ruleset: string): Promise<RaceApi[]> {
    return this.raceRepository.obtenerPorSistema(ruleset);
  }

  obtenerPorId(id: string): Promise<RaceApi | undefined> {
    return this.raceRepository.obtenerPorId(id);
  }

  crear(race: CreateRace): Promise<RaceApi> {
    return this.raceRepository.crear(race);
  }

  actualizar(race: CreateRace): Promise<RaceApi | undefined> {
    return this.raceRepository.actualizar(race);
  }

  softDelete(id: string): Promise<boolean> {
    return this.raceRepository.softDelete(id);
  }

  restore(id: string): Promise<boolean> {
    return this.raceRepository.restore(id);
  }
}
