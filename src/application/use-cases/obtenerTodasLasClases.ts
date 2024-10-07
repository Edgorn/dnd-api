import ClaseService from "../../domain/services/clase.service";

export default class ObtenerTodasLasClases {
  private claseService: ClaseService

  constructor(claseService: ClaseService) {
    console.log('DENTRO')
    this.claseService = claseService;
  }

  async execute() {
    return await this.claseService.obtenerTodasLasClases();
  }
}
