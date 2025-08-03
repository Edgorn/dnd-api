import IRazaRepository from "../repositories/IRazaRepository";
import { RaceApi } from "../types/razas.types";

export default class RazaService {
  private razaRepository: IRazaRepository;

  constructor(razaRepository: IRazaRepository) {
    this.razaRepository = razaRepository;
  }

  async obtenerTodasLasRazas(): Promise<{success: boolean, data?: RaceApi[], message?: string}> {
    try {
      const razas = await this.razaRepository.obtenerTodas();
      return { success: true, data: razas };
    } catch (error) {
      console.error(error)
      return { success: false, message: 'Error al recuperar las razas' };
    }
  }
}
