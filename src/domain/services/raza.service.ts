import IRazaRepository from "../repositories/IRazaRepository";
import { CreateRace, RaceApi } from "../types/razas.types";

export default class RazaService {
  constructor(private readonly razaRepository: IRazaRepository) { }

  obtenerTodas(): Promise<RaceApi[]> {
    return this.razaRepository.obtenerTodas();
  }

  obtenerPorSistema(ruleset: string): Promise<RaceApi[]> {
    return this.razaRepository.obtenerPorSistema(ruleset);
  }

  crear(race: CreateRace): Promise<RaceApi> {
    return this.razaRepository.crear(race);
  }

  actualizar(race: CreateRace): Promise<RaceApi | undefined> {
    return this.razaRepository.actualizar(race);
  }
}
