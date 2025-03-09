import RazaService from "../../domain/services/raza.service";
import { RaceApi } from "../../domain/types/razas";

export default class ObtenerTodasLasRazas {
  private razaService: RazaService

  constructor(razaService: RazaService) {
    this.razaService = razaService;
  }

  async execute(): Promise<{success: boolean, data?: RaceApi[], message?: string}> {
    return await this.razaService.obtenerTodasLasRazas();
  }
}
