import IClaseRepository from "../repositories/IClaseRepository";

export default class ClaseService {
  constructor(private readonly claseRepository: IClaseRepository) { }

  async obtenerTodas() {
    return this.claseRepository.obtenerTodas();
  }
}