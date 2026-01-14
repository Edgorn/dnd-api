import EquipamientoService from "../../../domain/services/equipamiento.service"
import { EquipamientoBasico } from "../../../domain/types/equipamientos.types"

export default class ObtenerEquipamientosPorTipos {
  constructor(private readonly equipamientoService: EquipamientoService) { }

  execute(types: string[]): Promise<EquipamientoBasico[]> {
    return this.equipamientoService.obtenerEquipamientosPorTipos(types)
  }
}
