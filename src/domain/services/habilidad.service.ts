import HabilidadRepository from "../../infrastructure/databases/mongoDb/repositories/habilidad.repository";
import { HabilidadApi } from "../types/habilidades.types";

export default class HabilidadService {
  constructor(private readonly habilidadRepository: HabilidadRepository) { }

  obtenerTodos(): Promise<HabilidadApi[]> {
    return this.habilidadRepository.obtenerTodos();
  }
}
