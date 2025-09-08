import IClaseRepository from "../repositories/IClaseRepository";
import { ClaseApi } from "../types/clases.types";

export default class ClaseService {
  constructor(private readonly claseRepository: IClaseRepository) { }

  obtenerTodas(): Promise<ClaseApi[]> {
    return this.claseRepository.obtenerTodas();
  }
}