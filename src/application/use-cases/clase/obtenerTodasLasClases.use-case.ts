import ClaseService from "../../../domain/services/clase.service";

export default class ObtenerTodasLasClases {
  constructor(private readonly claseService: ClaseService) { }

  execute() {
    return this.claseService.obtenerTodas();
  }
}