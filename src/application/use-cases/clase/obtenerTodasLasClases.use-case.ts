import ClaseService from "../../../domain/services/clase.service";

export default class ObtenerTodasLasClases {
  constructor(private readonly claseService: ClaseService) { }

  async execute() {
    return await this.claseService.obtenerTodas();
  }
}