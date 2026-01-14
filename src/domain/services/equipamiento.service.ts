import IEquipamientoRepository from "../repositories/IEquipamientoRepository";
import { EquipamientoBasico } from "../types/equipamientos.types";

export default class EquipamientoService {
  constructor(private readonly equipamientoRepository: IEquipamientoRepository) { }

  obtenerEquipamientosPorTipos(types: string[]): Promise<EquipamientoBasico[]> {
    return this.equipamientoRepository.obtenerEquipamientosPorTipos(types);
  }
}
