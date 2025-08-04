import IRazaRepository from "../repositories/IRazaRepository";
import { RaceApi } from "../types/razas.types";

export default class RazaService {
  constructor(private readonly razaRepository: IRazaRepository) { }

  obtenerTodos(): Promise<RaceApi[]> {
    return this.razaRepository.obtenerTodas();
  }
}
