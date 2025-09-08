import IEquipamientoRepository from "../repositories/IEquipamientoRepository";
import { EquipamientoBasico } from "../types/equipamientos.types";

export default class EquipamientoService {
  constructor(private readonly equipamientoRepository: IEquipamientoRepository) { }

  obtenerEquipamientosPorTipo(type: string): Promise<EquipamientoBasico[]> {
    return this.equipamientoRepository.obtenerEquipamientosPorTipo(type);
  }
}
