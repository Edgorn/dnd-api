import EquipamientoService from "../../../domain/services/equipamiento.service"
import { EquipamientoBasico } from "../../../domain/types/equipamientos.types"

export default class ObtenerEquipamientosPorTipo {
  constructor(private readonly equipamientoService: EquipamientoService) { }

  execute(type: string): Promise<EquipamientoBasico[]> {
    return this.equipamientoService.obtenerEquipamientosPorTipo(type)
  }
}
