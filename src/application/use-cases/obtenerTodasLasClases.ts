import ClaseService from "../../domain/services/clase.service";

export default class ObtenerTodasLasClases {
  private claseService: ClaseService

  constructor(claseService: ClaseService) {
    this.claseService = claseService;
  }

  async execute() {
    return await this.claseService.obtenerTodasLasClases();
  }
}
