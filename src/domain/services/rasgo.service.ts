import IRasgoRepository from "../repositories/IRasgoRepository";
import { RasgoApi } from "../types/rasgos.types";

export default class RasgoService {
  constructor(private readonly rasgoRepository: IRasgoRepository) { }

  obtenerPorSistemas(ruleset: string[]): Promise<RasgoApi[]> {
    return this.rasgoRepository.obtenerPorSistemas(ruleset);
  }
}
