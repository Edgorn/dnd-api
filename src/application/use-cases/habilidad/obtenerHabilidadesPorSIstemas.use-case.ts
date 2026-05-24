import HabilidadService from "../../../domain/services/habilidad.service";
import { HabilidadApi } from "../../../domain/types/habilidades.types";

export default class ObtenerTodasLasHabilidades {
  constructor(private readonly habilidadService: HabilidadService) { }

  execute(): Promise<HabilidadApi[]> {
    return this.habilidadService.obtenerTodos();
  }
}