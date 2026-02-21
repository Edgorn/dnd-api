import ICriaturaRepository from "../repositories/ICriaturaRepository";
import { CriaturaApi } from "../types/criaturas.types";

export default class CriaturaService {
  constructor(private readonly criaturaRepository: ICriaturaRepository) { }

  obtenerTodas(): Promise<CriaturaApi[]> {
    return this.criaturaRepository.obtenerTodas();
  }

  obtenerPorTipos(types: string[]): Promise<CriaturaApi[]> {
    return this.criaturaRepository.obtenerPorTipos(types);
  }
}
