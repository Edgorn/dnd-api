import RazaService from "../../../domain/services/raza.service";
import { RaceApi } from "../../../domain/types/razas.types";

export default class ObtenerTodasLasRazas {
  constructor(private readonly razaService: RazaService) { }

  execute(): Promise<RaceApi[]> {
    return this.razaService.obtenerTodos();
  }
}