import IRasgoRepository from "../repositories/IRasgoRepository";
import { CreateRasgo, RasgoApi, UpdateRasgo } from "../types/rasgos.types";

export default class RasgoService {
  constructor(private readonly rasgoRepository: IRasgoRepository) { }

  obtenerPorSistemas(ruleset: string[]): Promise<RasgoApi[]> {
    return this.rasgoRepository.obtenerPorSistemas(ruleset);
  }

  create(rasgo: CreateRasgo): Promise<RasgoApi> {
    return this.rasgoRepository.create(rasgo);
  }

  update(rasgo: UpdateRasgo): Promise<RasgoApi> {
    return this.rasgoRepository.update(rasgo);
  }
}
