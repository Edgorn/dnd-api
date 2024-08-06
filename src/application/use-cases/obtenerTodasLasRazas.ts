import RazaService from "../../domain/services/raza.service";

export default class ObtenerTodasLasRazas {
  private razaService: RazaService

  constructor(razaService: RazaService) {
    this.razaService = razaService;
  }

  async execute(): Promise<any> {
    return await this.razaService.obtenerTodasLasRazas();
  }
}
