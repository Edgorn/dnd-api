import IClaseRepository from "../repositories/IClaseRepository";
import { ClaseApi } from "../types/clases.types";

export default class ClaseService {
  constructor(private readonly claseRepository: IClaseRepository) { }

  async obtenerTodas(): Promise<ClaseApi[]> {
    return this.claseRepository.obtenerTodas();
  }
}